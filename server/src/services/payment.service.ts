import type { PaymentType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { makeReference } from '../lib/utils';
import { isDuplicatePaymentViolation } from '../middleware/error';
import { saveFile } from './storage.service';
import { getSettings } from './settings.service';
import { lockBooking, moveToRequirementsStage, transition } from './booking.service';

/**
 * PAYMENTS
 * Uploaded proofs are NEVER marked successful automatically – an admin must verify.
 * The `gateway*` columns + `kind = ONLINE_GATEWAY` payment methods are reserved
 * for a future PayMongo / Xendit / Maya integration (webhook would call
 * `approvePayment` with a system actor after signature verification).
 */

export async function submitReservationPayment(
  userId: string | null,
  bookingId: string,
  input: { paymentMethodId: string; referenceNumber: string; idempotencyKey?: string },
  file: Express.Multer.File | undefined,
) {
  if (input.idempotencyKey) {
    const existing = await prisma.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.bookingId !== bookingId) throw AppError.conflict('Idempotency key already used');
      return { payment: existing, duplicate: true };
    }
  }
  if (!file) throw AppError.badRequest('Please upload a screenshot or photo of your payment receipt');

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound('Booking not found');
  if (userId && booking.customerId !== userId) throw AppError.notFound('Booking not found');
  if (booking.status !== 'PENDING_PAYMENT')
    throw AppError.conflict(
      booking.status === 'DRAFT' ? 'Please submit your booking first' : 'This booking is not awaiting payment',
      'NOT_AWAITING_PAYMENT',
    );

  const method = await prisma.paymentMethod.findFirst({
    where: { id: input.paymentMethodId, isActive: true, isCustomerSelectable: true, deletedAt: null },
  });
  if (!method) throw AppError.badRequest('Invalid payment method');

  const stored = await saveFile(file, { folder: `payments/${bookingId}`, visibility: 'private' });
  const effectiveUserId = userId || booking.customerId;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const b = await lockBooking(tx, bookingId);
      if (b.status !== 'PENDING_PAYMENT') throw AppError.conflict('This booking is not awaiting payment', 'NOT_AWAITING_PAYMENT');
      if (b.holdExpiresAt && b.holdExpiresAt < new Date())
        throw AppError.conflict('Your reservation hold has expired. Please create a new booking.', 'HOLD_EXPIRED');
      const p = await tx.payment.create({
        data: {
          bookingId,
          paymentMethodId: method.id,
          type: 'RESERVATION_FEE',
          status: 'PENDING_VERIFICATION',
          amount: b.reservationFee, // amount is fixed by the server
          referenceNumber: input.referenceNumber.trim(),
          proofStorageProvider: stored.provider,
          proofStorageKey: stored.key,
          proofMimeType: file.mimetype,
          idempotencyKey: input.idempotencyKey,
          submittedById: effectiveUserId,
          paidAt: new Date(),
        },
      });
      // Keep the vehicle held while the admin verifies the payment.
      await transition(tx, b, 'PAYMENT_VERIFICATION', effectiveUserId, 'Reservation payment proof uploaded', { holdExpiresAt: null });
      return p;
    });
    return { payment, duplicate: false };
  } catch (e) {
    if (isDuplicatePaymentViolation(e))
      throw AppError.conflict(
        'A payment with this reference number already exists, or a reservation payment is already pending for this booking.',
        'DUPLICATE_PAYMENT',
      );
    throw e;
  }
}

export async function approvePayment(actorId: string, paymentId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId}::uuid FOR UPDATE`;
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw AppError.notFound('Payment not found');
    if (p.status !== 'PENDING_VERIFICATION') throw AppError.conflict(`Payment is already ${p.status}`);
    const updated = await tx.payment.update({
      where: { id: p.id },
      data: { status: 'APPROVED', verifiedById: actorId, verifiedAt: new Date(), receiptNumber: makeReference('OR') },
    });
    let movedToRequirements = false;
    if (p.type === 'RESERVATION_FEE') {
      const b = await lockBooking(tx, p.bookingId);
      if (['PAYMENT_VERIFICATION', 'PENDING_PAYMENT'].includes(b.status)) {
        await moveToRequirementsStage(tx, b, actorId);
        movedToRequirements = true;
      }
    }
    return { before: p, payment: updated, movedToRequirements };
  });
}

export async function rejectPayment(actorId: string, paymentId: string, reason: string) {
  const settings = await getSettings();
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId}::uuid FOR UPDATE`;
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw AppError.notFound('Payment not found');
    if (p.status !== 'PENDING_VERIFICATION') throw AppError.conflict(`Payment is already ${p.status}`);
    const updated = await tx.payment.update({
      where: { id: p.id },
      data: { status: 'REJECTED', verifiedById: actorId, verifiedAt: new Date(), rejectionReason: reason },
    });
    if (p.type === 'RESERVATION_FEE') {
      const b = await lockBooking(tx, p.bookingId);
      if (b.status === 'PAYMENT_VERIFICATION')
        await transition(tx, b, 'PENDING_PAYMENT', actorId, `Payment rejected: ${reason}`, {
          holdExpiresAt: new Date(Date.now() + settings.booking.paymentHoldHours * 3_600_000),
        });
    }
    return { before: p, payment: updated };
  });
}

/** Admin records an over-the-counter payment (cash, balance, deposit, refund...). Approved immediately. */
export async function recordPayment(
  actorId: string,
  bookingId: string,
  input: { type: PaymentType; amount: number; paymentMethodId: string; referenceNumber?: string | null; notes?: string | null; paidAt?: Date },
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const b = await lockBooking(tx, bookingId);
      const method = await tx.paymentMethod.findFirst({ where: { id: input.paymentMethodId, deletedAt: null } });
      if (!method) throw AppError.badRequest('Invalid payment method');
      const p = await tx.payment.create({
        data: {
          bookingId,
          paymentMethodId: method.id,
          type: input.type,
          status: 'APPROVED',
          amount: input.amount,
          referenceNumber: input.referenceNumber?.trim() || null,
          notes: input.notes,
          submittedById: actorId,
          verifiedById: actorId,
          verifiedAt: new Date(),
          paidAt: input.paidAt ?? new Date(),
          receiptNumber: makeReference('OR'),
        },
      });
      if (input.type === 'RESERVATION_FEE' && ['PENDING_PAYMENT', 'PAYMENT_VERIFICATION'].includes(b.status)) {
        await moveToRequirementsStage(tx, b, actorId);
      }
      return p;
    });
  } catch (e) {
    if (isDuplicatePaymentViolation(e))
      throw AppError.conflict('Duplicate payment: a reservation fee is already recorded or the reference number was already used.', 'DUPLICATE_PAYMENT');
    throw e;
  }
}

