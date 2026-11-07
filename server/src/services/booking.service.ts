import type { Booking, BookingStatus, Prisma, RentalType } from '@prisma/client';
import { prisma, type Tx } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { makeReference, toCents, fromCents, cleanWin1252 } from '../lib/utils';
import { isOverlapViolation } from '../middleware/error';
import { lockAndAssertAvailable, ACTIVE_STATUSES } from './availability.service';
import { calculateQuote, type Quote, type QuoteInput } from './pricing.service';
import { getSettings } from './settings.service';

// ---------------------------------------------------------------------------
// Status machine
// ---------------------------------------------------------------------------
export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED', 'EXPIRED'],
  PENDING_PAYMENT: ['PAYMENT_VERIFICATION', 'PENDING_REQUIREMENTS', 'REQUIREMENTS_REVIEW', 'CANCELLED', 'EXPIRED', 'REJECTED'],
  PAYMENT_VERIFICATION: ['PENDING_PAYMENT', 'PENDING_REQUIREMENTS', 'REQUIREMENTS_REVIEW', 'CANCELLED', 'REJECTED'],
  PENDING_REQUIREMENTS: ['REQUIREMENTS_REVIEW', 'CANCELLED', 'REJECTED'],
  REQUIREMENTS_REVIEW: ['PENDING_REQUIREMENTS', 'CONFIRMED', 'CANCELLED', 'REJECTED'],
  CONFIRMED: ['ONGOING', 'CANCELLED', 'PENDING_REQUIREMENTS'],
  ONGOING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
};

export const TERMINAL: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'];

export async function transition(
  tx: Tx,
  booking: Pick<Booking, 'id' | 'status'>,
  to: BookingStatus,
  actorId: string | null,
  note?: string,
  extra: Prisma.BookingUpdateInput = {},
) {
  if (booking.status === to) return tx.booking.update({ where: { id: booking.id }, data: extra });
  if (!TRANSITIONS[booking.status].includes(to))
    throw AppError.conflict(`Cannot change booking from ${booking.status} to ${to}`, 'INVALID_TRANSITION');
  const updated = await tx.booking.update({ where: { id: booking.id }, data: { status: to, ...extra } });
  await tx.bookingStatusHistory.create({
    data: { bookingId: booking.id, fromStatus: booking.status, toStatus: to, actorId, note },
  });
  return updated;
}

/** Locks the booking row for the remainder of the transaction. */
export async function lockBooking(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${id}::uuid FOR UPDATE`;
  const b = await tx.booking.findUnique({ where: { id } });
  if (!b) throw AppError.notFound('Booking not found');
  return b;
}

// ---------------------------------------------------------------------------
// Requirements / confirmation rules
// ---------------------------------------------------------------------------
export async function requirementSummary(tx: Tx | typeof prisma, bookingId: string) {
  const reqs = await tx.bookingRequirement.findMany({ where: { bookingId } });
  const required = reqs.filter((r) => r.isRequired);
  return {
    allSubmitted: required.every((r) => r.status === 'SUBMITTED' || r.status === 'APPROVED'),
    allApproved: required.every((r) => r.status === 'APPROVED'),
    missing: required.filter((r) => !['SUBMITTED', 'APPROVED'].includes(r.status)).map((r) => r.name),
  };
}

export async function reservationFeePaid(tx: Tx | typeof prisma, bookingId: string) {
  const p = await tx.payment.findFirst({ where: { bookingId, type: 'RESERVATION_FEE', status: 'APPROVED' } });
  return !!p;
}

/** After the reservation fee is verified, move the booking to the requirements stage. */
export async function moveToRequirementsStage(tx: Tx, booking: Pick<Booking, 'id' | 'status'>, actorId: string | null) {
  const s = await requirementSummary(tx, booking.id);
  const to: BookingStatus = s.allSubmitted ? 'REQUIREMENTS_REVIEW' : 'PENDING_REQUIREMENTS';
  return transition(tx, booking, to, actorId, 'Reservation fee verified', { holdExpiresAt: null });
}

/** Keeps PENDING_REQUIREMENTS <-> REQUIREMENTS_REVIEW in sync with uploads & reviews. */
export async function syncRequirementStage(tx: Tx, bookingId: string, actorId: string | null) {
  const b = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!b) return;
  const s = await requirementSummary(tx, bookingId);
  if (b.status === 'PENDING_REQUIREMENTS' && s.allSubmitted)
    await transition(tx, b, 'REQUIREMENTS_REVIEW', actorId, 'All requirements submitted');
  else if (b.status === 'REQUIREMENTS_REVIEW' && !s.allSubmitted)
    await transition(tx, b, 'PENDING_REQUIREMENTS', actorId, 'Requirement re-upload needed');
  else if (b.status === 'CONFIRMED' && !s.allSubmitted)
    await transition(tx, b, 'PENDING_REQUIREMENTS', actorId, 'Requirement re-upload needed');
}

/** Returns the list of unmet conditions that block confirmation (empty = can confirm). */
export async function confirmationBlockers(tx: Tx | typeof prisma, booking: Booking) {
  const blockers: string[] = [];
  if (booking.status !== 'REQUIREMENTS_REVIEW')
    blockers.push(`Booking must be in REQUIREMENTS_REVIEW (currently ${booking.status})`);
  if (!(await reservationFeePaid(tx, booking.id))) blockers.push('Reservation fee payment has not been verified');
  const s = await requirementSummary(tx, booking.id);
  if (!s.allApproved) blockers.push('Not all required documents have been approved');
  return blockers;
}

// ---------------------------------------------------------------------------
// Financials (reservation fee and security deposit kept separate)
// ---------------------------------------------------------------------------
export async function bookingFinancials(db: Tx | typeof prisma, booking: Pick<Booking, 'id' | 'totalAmount'>) {
  const pays = await db.payment.findMany({ where: { bookingId: booking.id, status: 'APPROVED' } });
  const sum = (t: string) => pays.filter((p) => p.type === t).reduce((s, p) => s + toCents(p.amount), 0);
  const reservation = sum('RESERVATION_FEE');
  const rental = sum('RENTAL_BALANCE');
  const additional = sum('ADDITIONAL_CHARGE');
  const refunds = sum('REFUND');
  const depositIn = sum('SECURITY_DEPOSIT');
  const depositOut = sum('SECURITY_DEPOSIT_REFUND');
  const total = toCents(booking.totalAmount);
  return {
    totalAmount: fromCents(total),
    reservationFeePaid: fromCents(reservation),
    rentalPaymentsPaid: fromCents(rental),
    additionalChargesPaid: fromCents(additional),
    refunds: fromCents(refunds),
    amountPaidTowardsRental: fromCents(reservation + rental - refunds),
    balanceDue: fromCents(Math.max(0, total - reservation - rental + refunds)),
    securityDeposit: {
      collected: fromCents(depositIn),
      refunded: fromCents(depositOut),
      held: fromCents(depositIn - depositOut),
    },
  };
}

// ---------------------------------------------------------------------------
// Create / update drafts
// ---------------------------------------------------------------------------
export interface DraftInput extends QuoteInput {
  customer?: Partial<CustomerInfo>;
}
export interface CustomerInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  purpose: string;
}

function pricingData(q: Quote) {
  return {
    ratePlan: q.ratePlan,
    rentalDays: q.rentalDays,
    rentalHours: q.rentalHours,
    rentalFee: q.rentalFee,
    deliveryFee: q.deliveryFee,
    carwashFee: q.carwashFee,
    otherFees: q.otherFees,
    discount: q.discount,
    totalAmount: q.totalAmount,
    reservationFee: q.reservationFee,
    promotionId: q.promotion?.id ?? null,
    pricingBreakdown: q as unknown as Prisma.InputJsonValue,
  };
}

async function syncRequirements(tx: Tx, bookingId: string, rentalType: RentalType) {
  const types = await tx.requirementType.findMany({
    where: { isActive: true, appliesTo: { in: [rentalType, 'BOTH'] } },
    orderBy: { sortOrder: 'asc' },
  });
  const existing = await tx.bookingRequirement.findMany({ where: { bookingId }, include: { documents: true } });
  // remove requirements that no longer apply and have no uploads
  const keep = new Set(types.map((t) => t.id));
  const removable = existing.filter((e) => !keep.has(e.requirementTypeId) && e.documents.length === 0).map((e) => e.id);
  if (removable.length) await tx.bookingRequirement.deleteMany({ where: { id: { in: removable } } });
  const have = new Set(existing.map((e) => e.requirementTypeId));
  const toCreate = types.filter((t) => !have.has(t.id));
  if (toCreate.length)
    await tx.bookingRequirement.createMany({
      data: toCreate.map((t) => ({ bookingId, requirementTypeId: t.id, name: t.name, isRequired: t.isRequired })),
    });
}

async function writeFees(tx: Tx, bookingId: string, q: Quote) {
  await tx.bookingFee.deleteMany({ where: { bookingId } });
  if (q.fees.length)
    await tx.bookingFee.createMany({
      data: q.fees.map((f) => ({ bookingId, additionalFeeId: f.additionalFeeId, type: f.type, name: f.name, amount: f.amount })),
    });
}

function assertSchedule(pickupAt: Date, returnAt: Date, minLeadHours: number) {
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime())) throw AppError.badRequest('Invalid dates');
  if (pickupAt.getTime() < Date.now() + minLeadHours * 3_600_000)
    throw AppError.badRequest(`Pick-up must be at least ${minLeadHours} hour(s) from now`);
  if (returnAt <= pickupAt) throw AppError.badRequest('Return must be after pick-up');
}

export async function createDraft(userId: string, input: DraftInput) {
  const settings = await getSettings();
  assertSchedule(input.pickupAt, input.returnAt, settings.booking.minLeadHours);

  const activeHolds = await prisma.booking.count({
    where: { customerId: userId, status: { in: ['DRAFT', 'PENDING_PAYMENT'] }, holdExpiresAt: { gt: new Date() } },
  });
  if (activeHolds >= settings.booking.maxActiveHoldsPerCustomer)
    throw AppError.conflict(
      'You have too many unfinished reservations. Please complete or cancel them before creating a new one.',
      'TOO_MANY_HOLDS',
    );

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });

  try {
    return await prisma.$transaction(
      async (tx) => {
        await lockAndAssertAvailable(tx, input);
        const quote = await calculateQuote(input, tx);
        const c = input.customer ?? {};
        const booking = await tx.booking.create({
          data: {
            reference: makeReference('CW'),
            customerId: userId,
            vehicleId: input.vehicleId,
            destinationId: input.destinationId,
            rentalType: input.rentalType,
            pickupAt: input.pickupAt,
            returnAt: input.returnAt,
            status: 'DRAFT',
            holdExpiresAt: new Date(Date.now() + settings.booking.draftHoldMinutes * 60_000),
            customerName: cleanWin1252(c.customerName ?? user.fullName),
            customerEmail: cleanWin1252(c.customerEmail ?? user.email),
            customerPhone: cleanWin1252(c.customerPhone ?? user.phone ?? ''),
            customerAddress: c.customerAddress ? cleanWin1252(c.customerAddress) : user.profile?.address ?? null,
            emergencyContactName: c.emergencyContactName ? cleanWin1252(c.emergencyContactName) : user.profile?.emergencyContactName ?? null,
            emergencyContactPhone: c.emergencyContactPhone ? cleanWin1252(c.emergencyContactPhone) : user.profile?.emergencyContactPhone ?? null,
            purpose: c.purpose ? cleanWin1252(c.purpose) : null,
            pickupMethod: input.pickupMethod ?? 'OFFICE',
            ...pricingData(quote),
          },
        });
        await writeFees(tx, booking.id, quote);
        await syncRequirements(tx, booking.id, input.rentalType);
        await tx.bookingStatusHistory.create({
          data: { bookingId: booking.id, toStatus: 'DRAFT', actorId: userId, note: 'Booking started – vehicle on hold' },
        });
        return booking;
      },
      { timeout: 15_000 },
    );
  } catch (e) {
    if (isOverlapViolation(e))
      throw AppError.conflict('The vehicle was just booked by someone else for that schedule.', 'VEHICLE_UNAVAILABLE');
    throw e;
  }
}

export async function updateDraft(
  userId: string | null,
  bookingId: string,
  input: Partial<DraftInput> & { deliveryAddress?: string | null },
) {
  const settings = await getSettings();
  try {
    return await prisma.$transaction(
      async (tx) => {
        const b = await lockBooking(tx, bookingId);
        if (userId && b.customerId !== userId) throw AppError.notFound('Booking not found');
        if (b.status !== 'DRAFT') throw AppError.conflict('Only draft bookings can be edited', 'NOT_EDITABLE');

        const fees = await tx.bookingFee.findMany({ where: { bookingId } });
        const merged: QuoteInput = {
          vehicleId: b.vehicleId,
          destinationId: input.destinationId ?? b.destinationId,
          rentalType: input.rentalType ?? b.rentalType,
          pickupAt: input.pickupAt ?? b.pickupAt,
          returnAt: input.returnAt ?? b.returnAt,
          pickupMethod: (input.pickupMethod ?? b.pickupMethod) as 'OFFICE' | 'DELIVERY',
          deliveryZoneId:
            input.deliveryZoneId !== undefined ? input.deliveryZoneId : fees.find((f) => f.type === 'DELIVERY')?.additionalFeeId,
          surchargeIds:
            input.surchargeIds ?? fees.filter((f) => f.type === 'DELIVERY_SURCHARGE').map((f) => f.additionalFeeId!).filter(Boolean),
          promoCode: input.promoCode !== undefined ? input.promoCode : undefined,
          unliMileage: input.unliMileage ?? b.ratePlan === 'MONTHLY_UNLI',
        };
        if (merged.promoCode === undefined && b.promotionId) {
          const promo = await tx.promotion.findUnique({ where: { id: b.promotionId } });
          merged.promoCode = promo?.code ?? null;
        }

        const scheduleChanged =
          merged.pickupAt.getTime() !== b.pickupAt.getTime() || merged.returnAt.getTime() !== b.returnAt.getTime();
        if (scheduleChanged) assertSchedule(merged.pickupAt, merged.returnAt, settings.booking.minLeadHours);
        if (scheduleChanged || (b.holdExpiresAt && b.holdExpiresAt < new Date()))
          await lockAndAssertAvailable(tx, { ...merged, excludeBookingId: b.id });

        const quote = await calculateQuote(merged, tx);
        const c = input.customer ?? {};
        const updated = await tx.booking.update({
          where: { id: b.id },
          data: {
            destinationId: merged.destinationId,
            rentalType: merged.rentalType,
            pickupAt: merged.pickupAt,
            returnAt: merged.returnAt,
            pickupMethod: merged.pickupMethod,
            deliveryAddress: merged.pickupMethod === 'DELIVERY' ? (input.deliveryAddress ?? b.deliveryAddress) : null,
            holdExpiresAt: new Date(Date.now() + settings.booking.draftHoldMinutes * 60_000), // refresh hold
            ...(c.customerName !== undefined && { customerName: c.customerName }),
            ...(c.customerEmail !== undefined && { customerEmail: c.customerEmail }),
            ...(c.customerPhone !== undefined && { customerPhone: c.customerPhone }),
            ...(c.customerAddress !== undefined && { customerAddress: c.customerAddress }),
            ...(c.emergencyContactName !== undefined && { emergencyContactName: c.emergencyContactName }),
            ...(c.emergencyContactPhone !== undefined && { emergencyContactPhone: c.emergencyContactPhone }),
            ...(c.purpose !== undefined && { purpose: c.purpose }),
            ...pricingData(quote),
          },
        });
        await writeFees(tx, b.id, quote);
        if (merged.rentalType !== b.rentalType) await syncRequirements(tx, b.id, merged.rentalType);
        return updated;
      },
      { timeout: 15_000 },
    );
  } catch (e) {
    if (isOverlapViolation(e)) throw AppError.conflict('The vehicle is no longer available for that schedule.', 'VEHICLE_UNAVAILABLE');
    throw e;
  }
}

export async function submitDraft(userId: string | null, bookingId: string, ip?: string) {
  const settings = await getSettings();
  return prisma.$transaction(
    async (tx) => {
      const b = await lockBooking(tx, bookingId);
      if (userId && b.customerId !== userId) throw AppError.notFound('Booking not found');
      if (b.status !== 'DRAFT') throw AppError.conflict('Booking has already been submitted', 'ALREADY_SUBMITTED');
      const missing = (
        [
          ['customerName', 'full name'],
          ['customerEmail', 'email address'],
          ['customerPhone', 'mobile number'],
          ['customerAddress', 'complete address'],
          ['emergencyContactName', 'emergency contact name'],
          ['emergencyContactPhone', 'emergency contact number'],
          ['purpose', 'purpose of rental'],
        ] as const
      ).filter(([k]) => !b[k]);
      if (missing.length) throw AppError.unprocessable(`Please provide your ${missing.map((m) => m[1]).join(', ')}`);
      if (b.pickupMethod === 'DELIVERY' && !b.deliveryAddress) throw AppError.unprocessable('Please provide the delivery address');

      if (!b.holdExpiresAt || b.holdExpiresAt < new Date())
        await lockAndAssertAvailable(tx, { vehicleId: b.vehicleId, pickupAt: b.pickupAt, returnAt: b.returnAt, excludeBookingId: b.id });

      const updated = await transition(tx, b, 'PENDING_PAYMENT', userId || b.customerId, 'Booking submitted by customer', {
        submittedAt: new Date(),
        holdExpiresAt: new Date(Date.now() + settings.booking.paymentHoldHours * 3_600_000),
      });
      await tx.rentalAgreement.upsert({
        where: { bookingId: b.id },
        create: {
          bookingId: b.id,
          agreementNumber: b.reference.replace(/^CW/, 'RA'),
          termsSnapshot: [...settings.rentalTerms, '', 'BOOKING POLICIES', ...settings.policies].join('\n').replace(/\u20b1/g, 'PHP '),
          acceptedAt: new Date(),
          acceptedIp: ip,
        },
        update: {},
      });
      return updated;
    },
    { timeout: 15_000 },
  );
}

// ---------------------------------------------------------------------------
// Rescheduling (admin, drag & drop, approved requests)
// ---------------------------------------------------------------------------
export async function rescheduleBooking(
  actorId: string,
  bookingId: string,
  pickupAt: Date,
  returnAt: Date,
  opts: { reprice?: boolean } = {},
) {
  if (!(returnAt > pickupAt)) throw AppError.badRequest('Return must be after pick-up');
  try {
    return await prisma.$transaction(
      async (tx) => {
        const b = await lockBooking(tx, bookingId);
        if (!ACTIVE_STATUSES.includes(b.status)) throw AppError.conflict(`A ${b.status} booking cannot be rescheduled`);
        await lockAndAssertAvailable(tx, {
          vehicleId: b.vehicleId,
          pickupAt,
          returnAt,
          excludeBookingId: b.id,
          ignoreVehicleStatus: true,
        });
        let pricing = {};
        if (opts.reprice !== false) {
          const fees = await tx.bookingFee.findMany({ where: { bookingId } });
          const base: QuoteInput = {
            vehicleId: b.vehicleId,
            destinationId: b.destinationId,
            rentalType: b.rentalType,
            pickupAt,
            returnAt,
            pickupMethod: b.pickupMethod as 'OFFICE' | 'DELIVERY',
            deliveryZoneId: fees.find((f) => f.type === 'DELIVERY')?.additionalFeeId,
            surchargeIds: fees.filter((f) => f.type === 'DELIVERY_SURCHARGE').map((f) => f.additionalFeeId!).filter(Boolean),
            unliMileage: b.ratePlan === 'MONTHLY_UNLI',
          };
          const promo = b.promotionId ? await tx.promotion.findUnique({ where: { id: b.promotionId } }) : null;
          let q: Quote;
          try {
            q = await calculateQuote({ ...base, promoCode: promo?.code ?? null }, tx);
          } catch {
            q = await calculateQuote({ ...base, unliMileage: false }, tx);
          }
          q.reservationFee = Number(b.reservationFee); // reservation fee already agreed
          q.balanceDue = Math.max(0, q.totalAmount - q.reservationFee);
          pricing = pricingData(q);
          await writeFees(tx, b.id, q);
        }
        const updated = await tx.booking.update({ where: { id: b.id }, data: { pickupAt, returnAt, ...pricing, reminderSentAt: null } });
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: b.id,
            fromStatus: b.status,
            toStatus: b.status,
            actorId,
            note: `Rescheduled from ${b.pickupAt.toISOString()} – ${b.returnAt.toISOString()} to ${pickupAt.toISOString()} – ${returnAt.toISOString()}`,
          },
        });
        return { before: b, after: updated };
      },
      { timeout: 15_000 },
    );
  } catch (e) {
    if (isOverlapViolation(e)) throw AppError.conflict('The vehicle is not available for the new schedule.', 'VEHICLE_UNAVAILABLE');
    throw e;
  }
}
