import type { Prisma, RateDuration, RentalType, VehicleRate } from '@prisma/client';
import { prisma, type Tx } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { fromCents, toCents } from '../lib/utils';
import { getSettings } from './settings.service';
import { getCached, setCached } from '../lib/cache';

/**
 * PRICING ENGINE
 * --------------
 * All prices are computed on the server from the admin-managed `vehicle_rates`
 * table. Customers can never submit a price – only their selections.
 *
 * Plan selection (the cheapest applicable PUBLISHED plan wins):
 *   HOURS_12      → rentals of 12 hours or less, flat amount
 *   HOURS_24      → per 24-hour day (rentals are rounded up to whole days)
 *   WEEKLY        → per-day rate when the rental is 7 days or longer
 *   MONTHLY       → per-day rate when the rental is 30 days or longer
 *   MONTHLY_UNLI  → only when the customer selects the unlimited-mileage plan (30+ days)
 * When pricing_unit = FLAT on WEEKLY/MONTHLY/MONTHLY_UNLI, the amount is treated
 * as the price of the whole 7/30-day block and prorated per day.
 */

export const RATE_DURATION_LABEL: Record<RateDuration, string> = {
  HOURS_12: '12 Hours',
  HOURS_24: '24 Hours',
  WEEKLY: 'Weekly (7 days) – per day',
  MONTHLY: 'Monthly – per day',
  MONTHLY_UNLI: 'Monthly – Unli Mileage',
};

export interface QuoteInput {
  vehicleId: string;
  destinationId: string;
  rentalType: RentalType;
  pickupAt: Date;
  returnAt: Date;
  pickupMethod?: 'OFFICE' | 'DELIVERY';
  deliveryZoneId?: string | null;
  surchargeIds?: string[];
  promoCode?: string | null;
  unliMileage?: boolean;
}

export interface FeeLine {
  additionalFeeId: string | null;
  type: 'DELIVERY' | 'DELIVERY_SURCHARGE' | 'CARWASH' | 'OTHER';
  name: string;
  amount: number;
}

export interface Quote {
  vehicleId: string;
  destinationId: string;
  rentalType: RentalType;
  pickupAt: string;
  returnAt: string;
  rentalHours: number;
  rentalDays: number;
  ratePlan: RateDuration;
  ratePlanLabel: string;
  rateAmount: number;
  rateUnit: string;
  rentalFeeLabel: string;
  rentalFee: number;
  fees: FeeLine[];
  deliveryFee: number;
  carwashFee: number;
  otherFees: number;
  discount: number;
  promotion: { id: string; name: string; code: string | null } | null;
  totalAmount: number;
  reservationFee: number;
  balanceDue: number;
}

const BLOCK_DAYS: Partial<Record<RateDuration, number>> = { WEEKLY: 7, MONTHLY: 30, MONTHLY_UNLI: 30 };

function perDayCents(rate: VehicleRate) {
  const cents = toCents(rate.amount);
  if (rate.pricingUnit === 'FLAT' && BLOCK_DAYS[rate.duration]) return cents / BLOCK_DAYS[rate.duration]!;
  return cents;
}

export function computeDuration(pickupAt: Date, returnAt: Date) {
  const ms = returnAt.getTime() - pickupAt.getTime();
  const rentalHours = Math.ceil(ms / 3_600_000);
  const rentalDays = Math.max(1, Math.ceil(rentalHours / 24));
  return { rentalHours, rentalDays };
}

export async function calculateQuote(input: QuoteInput, db: Tx | typeof prisma = prisma): Promise<Quote> {
  const settings = await getSettings(db);
  const { pickupAt, returnAt } = input;
  if (!(returnAt > pickupAt)) throw AppError.badRequest('Return date/time must be after pick-up date/time');

  const vehicle = await db.vehicle.findFirst({ where: { id: input.vehicleId, deletedAt: null } });
  if (!vehicle) throw AppError.notFound('Vehicle not found');
  if (input.rentalType === 'SELF_DRIVE' && !vehicle.allowSelfDrive)
    throw AppError.badRequest('This vehicle is not available for self-drive');
  if (input.rentalType === 'WITH_DRIVER' && !vehicle.allowWithDriver)
    throw AppError.badRequest('This vehicle is not available with driver');

  const destination = await db.destination.findFirst({ where: { id: input.destinationId, isActive: true, deletedAt: null } });
  if (!destination) throw AppError.notFound('Destination not found');

  const { rentalHours, rentalDays } = computeDuration(pickupAt, returnAt);
  if (rentalHours < 1) throw AppError.badRequest('Rental must be at least 1 hour');
  if (rentalDays > settings.booking.maxRentalDays)
    throw AppError.badRequest(`Maximum rental length is ${settings.booking.maxRentalDays} days`);

  const rates = await db.vehicleRate.findMany({
    where: {
      vehicleId: vehicle.id,
      destinationId: destination.id,
      rentalType: input.rentalType,
      isPublished: true,
      amount: { not: null },
    },
  });
  const byPlan = new Map(rates.map((r) => [r.duration, r]));
  if (!rates.length)
    throw AppError.unprocessable(
      `Rates for ${vehicle.name} (${input.rentalType === 'SELF_DRIVE' ? 'Self Drive' : 'With Driver'}) to ${destination.name} are not yet available. Please contact Custoworks.`,
      { code: 'RATE_NOT_AVAILABLE' },
    );

  // --- choose plan ----------------------------------------------------------
  type Candidate = { plan: RateDuration; rate: VehicleRate; cents: number; label: string; unit: string };
  const candidates: Candidate[] = [];
  const r12 = byPlan.get('HOURS_12');
  const r24 = byPlan.get('HOURS_24');
  const rW = byPlan.get('WEEKLY');
  const rM = byPlan.get('MONTHLY');
  const rU = byPlan.get('MONTHLY_UNLI');

  if (input.unliMileage) {
    if (!rU || rentalDays < 30) throw AppError.badRequest('Unli-mileage monthly plan requires a rental of at least 30 days');
    const pd = perDayCents(rU);
    candidates.push({ plan: 'MONTHLY_UNLI', rate: rU, cents: Math.round(pd * rentalDays), label: `${rentalDays} day(s) × Monthly Unli Mileage`, unit: 'per day' });
  } else {
    if (r12 && rentalHours <= 12)
      candidates.push({ plan: 'HOURS_12', rate: r12, cents: toCents(r12.amount), label: '12-hour rental', unit: 'per 12 hours' });
    if (r24)
      candidates.push({ plan: 'HOURS_24', rate: r24, cents: toCents(r24.amount) * rentalDays, label: `${rentalDays} day(s) × 24-hour rate`, unit: 'per day' });
    if (rW && rentalDays >= 7)
      candidates.push({ plan: 'WEEKLY', rate: rW, cents: Math.round(perDayCents(rW) * rentalDays), label: `${rentalDays} day(s) × weekly per-day rate`, unit: 'per day' });
    if (rM && rentalDays >= 30)
      candidates.push({ plan: 'MONTHLY', rate: rM, cents: Math.round(perDayCents(rM) * rentalDays), label: `${rentalDays} day(s) × monthly per-day rate`, unit: 'per day' });
  }
  if (!candidates.length)
    throw AppError.unprocessable('No published rate plan covers the selected rental duration. Please contact Custoworks.', {
      code: 'RATE_NOT_AVAILABLE',
    });
  const chosen = candidates.reduce((a, b) => (b.cents < a.cents ? b : a));

  // --- additional fees ------------------------------------------------------
  const fees: FeeLine[] = [];
  if (input.pickupMethod === 'DELIVERY') {
    if (!input.deliveryZoneId) throw AppError.badRequest('Please select a delivery area');
    const zone = await db.additionalFee.findFirst({
      where: { id: input.deliveryZoneId, type: 'DELIVERY', isActive: true, deletedAt: null },
    });
    if (!zone) throw AppError.badRequest('Invalid delivery area');
    fees.push({ additionalFeeId: zone.id, type: 'DELIVERY', name: zone.name, amount: Number(zone.amount) });
    if (input.surchargeIds?.length) {
      const sur = await db.additionalFee.findMany({
        where: { id: { in: input.surchargeIds }, type: 'DELIVERY_SURCHARGE', isActive: true, deletedAt: null },
      });
      for (const s of sur) fees.push({ additionalFeeId: s.id, type: 'DELIVERY_SURCHARGE', name: s.name, amount: Number(s.amount) });
    }
  }
  // Post-rental Carwash Policy:
  // Carwash fee is NOT charged upfront in the initial rental total.
  // The vehicle is delivered clean to the customer. If returned clean/washed, no fee is charged (0 carwash fee).
  // If returned unwashed and requires cleaning, the fee (₱300 for Sedan, ₱400 for MPV / Van) is deducted
  // directly from the customer's refundable security deposit upon vehicle return inspection.
  const carwashCents = 0;
  const others = await db.additionalFee.findMany({ where: { type: 'OTHER', isActive: true, deletedAt: null } });
  for (const o of others) fees.push({ additionalFeeId: o.id, type: 'OTHER', name: o.name, amount: Number(o.amount) });

  const sumType = (...t: FeeLine['type'][]) => fees.filter((f) => t.includes(f.type)).reduce((s, f) => s + toCents(f.amount), 0);
  const deliveryCents = sumType('DELIVERY', 'DELIVERY_SURCHARGE');
  const otherCents = sumType('OTHER');

  // --- promotions -----------------------------------------------------------
  const promo = await findPromotion(db, {
    code: input.promoCode ?? null,
    vehicleId: vehicle.id,
    rentalType: input.rentalType,
    rentalDays,
    at: pickupAt,
  });
  let discountCents = 0;
  if (promo) {
    discountCents =
      promo.discountType === 'PERCENT'
        ? Math.round((chosen.cents * Math.min(100, Number(promo.value))) / 100)
        : Math.min(chosen.cents, toCents(promo.value));
  }

  const totalCents = chosen.cents + deliveryCents + carwashCents + otherCents - discountCents;
  const reservationCents = toCents(settings.booking.reservationFee);

  return {
    vehicleId: vehicle.id,
    destinationId: destination.id,
    rentalType: input.rentalType,
    pickupAt: pickupAt.toISOString(),
    returnAt: returnAt.toISOString(),
    rentalHours,
    rentalDays,
    ratePlan: chosen.plan,
    ratePlanLabel: RATE_DURATION_LABEL[chosen.plan],
    rateAmount: Number(chosen.rate.amount),
    rateUnit: chosen.unit,
    rentalFeeLabel: chosen.label,
    rentalFee: fromCents(chosen.cents),
    fees,
    deliveryFee: fromCents(deliveryCents),
    carwashFee: fromCents(carwashCents),
    otherFees: fromCents(otherCents),
    discount: fromCents(discountCents),
    promotion: promo ? { id: promo.id, name: promo.name, code: promo.code } : null,
    totalAmount: fromCents(totalCents),
    reservationFee: fromCents(reservationCents),
    // Full rental amount payable upon pickup; reservation fee is held as refundable security deposit
    balanceDue: fromCents(totalCents),
  };
}

async function findPromotion(
  db: Tx | typeof prisma,
  p: { code: string | null; vehicleId: string; rentalType: RentalType; rentalDays: number; at: Date },
) {
  const base: Prisma.PromotionWhereInput = {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: p.at } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: p.at } }] },
      { OR: [{ vehicleId: null }, { vehicleId: p.vehicleId }] },
      { OR: [{ rentalType: null }, { rentalType: p.rentalType }] },
      { OR: [{ minDays: null }, { minDays: { lte: p.rentalDays } }] },
    ],
  };
  if (p.code) {
    const promo = await db.promotion.findFirst({ where: { ...base, code: { equals: p.code, mode: 'insensitive' } } });
    if (!promo) throw AppError.badRequest('Promo code is invalid or not applicable to this booking');
    return promo;
  }
  const autos = await db.promotion.findMany({ where: { ...base, autoApply: true } });
  // pick highest-value auto promotion (percent compared roughly as % of ₱10k)
  return autos.sort((a, b) => score(b) - score(a))[0] ?? null;
}
const score = (p: { discountType: string; value: Prisma.Decimal }) =>
  p.discountType === 'PERCENT' ? Number(p.value) * 100 : Number(p.value);

/** "Starting at" prices for cards: lowest published 24h/12h rate per rental type. */
export async function startingRates(vehicleIds: string[]) {
  if (vehicleIds.length === 0) return {};
  const cacheKey = `starting_rates:${[...vehicleIds].sort().join(',')}`;
  const cached = getCached<Record<string, { SELF_DRIVE: number | null; WITH_DRIVER: number | null; SELF_DRIVE_12: number | null; WITH_DRIVER_12: number | null }>>(cacheKey);
  if (cached) return cached;

  const rates = await prisma.vehicleRate.findMany({
    where: { vehicleId: { in: vehicleIds }, isPublished: true, amount: { not: null }, duration: { in: ['HOURS_24', 'HOURS_12'] } },
    select: { vehicleId: true, rentalType: true, duration: true, amount: true },
  });
  const out: Record<string, { SELF_DRIVE: number | null; WITH_DRIVER: number | null; SELF_DRIVE_12: number | null; WITH_DRIVER_12: number | null }> = {};
  for (const id of vehicleIds) out[id] = { SELF_DRIVE: null, WITH_DRIVER: null, SELF_DRIVE_12: null, WITH_DRIVER_12: null };
  for (const r of rates) {
    const key = (r.duration === 'HOURS_12' ? `${r.rentalType}_12` : r.rentalType) as keyof (typeof out)[string];
    const cur = out[r.vehicleId][key];
    const amt = Number(r.amount);
    if (cur === null || amt < cur) out[r.vehicleId][key] = amt;
  }
  setCached(cacheKey, out, 300); // Cache for 5 minutes
  return out;
}

