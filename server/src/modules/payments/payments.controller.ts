import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { parse } from '../../middleware/error';
import { paginate } from '../../lib/utils';
import { audit } from '../../services/audit.service';
import { notifyAdmin, notifyBooking } from '../../services/notification.service';
import { streamPaymentReceipt } from '../../services/pdf.service';
import { saveFile } from '../../services/storage.service';
import { approvePayment, recordPayment, rejectPayment, submitReservationPayment } from '../../services/payment.service';
import {
  paymentMethodSchema,
  recordPaymentSchema,
  rejectPaymentSchema,
  submitPaymentSchema,
} from './payments.schema';

export async function listPublicPaymentMethods(_req: Request, res: Response) {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true, isCustomerSelectable: true, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ methods });
}

export async function adminListPaymentMethods(_req: Request, res: Response) {
  const methods = await prisma.paymentMethod.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ methods });
}

export async function createPaymentMethod(req: Request, res: Response) {
  const data = parse(paymentMethodSchema, req.body);
  const method = await prisma.paymentMethod.create({ data });
  await audit({ actorId: req.user!.id, action: 'payment_method.create', entityType: 'payment_method', entityId: method.id, req });
  res.status(201).json({ method });
}

export async function updatePaymentMethod(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(paymentMethodSchema.partial(), req.body);
  const method = await prisma.paymentMethod.update({ where: { id }, data });
  await audit({ actorId: req.user!.id, action: 'payment_method.update', entityType: 'payment_method', entityId: method.id, req });
  res.json({ method });
}

export async function uploadPaymentMethodQr(req: Request, res: Response) {
  const id = String(req.params.id);
  const file = req.file;
  if (!file) throw AppError.badRequest('No image file uploaded');

  const stored = await saveFile(file, { folder: `payment-methods/${id}`, visibility: 'public' });
  const method = await prisma.paymentMethod.update({
    where: { id },
    data: { qrImageUrl: stored.url },
  });

  res.json({ method });
}

export async function deletePaymentMethod(req: Request, res: Response) {
  const id = String(req.params.id);
  const method = await prisma.paymentMethod.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await audit({ actorId: req.user!.id, action: 'payment_method.delete', entityType: 'payment_method', entityId: method.id, req });
  res.json({ success: true, method });
}

export async function submitPaymentProof(req: Request, res: Response) {
  const bookingId = String(req.params.bookingId);
  const data = parse(submitPaymentSchema, req.body);

  const { payment, duplicate } = await submitReservationPayment(
    req.user?.id || null,
    bookingId,
    data,
    req.file
  );

  const actorId = req.user?.id || payment.submittedById;
  if (!duplicate) {
    await audit({ actorId, action: 'payment.submitted', entityType: 'payment', entityId: payment.id, req });
    await notifyBooking('PAYMENT_RECEIVED', bookingId);
    await notifyAdmin(
      'New Payment Proof Uploaded',
      `Payment proof for booking ${bookingId} submitted with ref ${data.referenceNumber}.`
    );
  }

  res.status(201).json({ payment, duplicate });
}

export async function adminApprovePayment(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await approvePayment(req.user!.id, id);

  await audit({
    actorId: req.user!.id,
    action: 'payment.approved',
    entityType: 'payment',
    entityId: id,
    before: result.before,
    after: result.payment,
    req,
  });

  await notifyBooking('PAYMENT_APPROVED', result.payment.bookingId);
  res.json({ payment: result.payment });
}

export async function adminRejectPayment(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(rejectPaymentSchema, req.body);
  const result = await rejectPayment(req.user!.id, id, data.reason);

  await audit({
    actorId: req.user!.id,
    action: 'payment.rejected',
    entityType: 'payment',
    entityId: id,
    details: data,
    before: result.before,
    after: result.payment,
    req,
  });

  await notifyBooking('PAYMENT_REJECTED', result.payment.bookingId, { reason: data.reason });
  res.json({ payment: result.payment });
}

export async function adminRecordPayment(req: Request, res: Response) {
  const data = parse(recordPaymentSchema, req.body);
  const payment = await recordPayment(req.user!.id, data.bookingId, {
    ...data,
    paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
  });

  await audit({ actorId: req.user!.id, action: 'payment.recorded_otc', entityType: 'payment', entityId: payment.id, req });
  res.status(201).json({ payment });
}

export async function adminListPayments(req: Request, res: Response) {
  const { status, type, search, page = 1, pageSize = 20 } = req.query;
  const { skip, take } = paginate({ page, pageSize });

  const where: any = {};
  if (status) where.status = String(status);
  if (type) where.type = String(type);
  if (search) {
    where.OR = [
      { referenceNumber: { contains: String(search), mode: 'insensitive' } },
      { receiptNumber: { contains: String(search), mode: 'insensitive' } },
      { booking: { reference: { contains: String(search), mode: 'insensitive' } } },
      { booking: { customerName: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        paymentMethod: true,
        booking: {
          select: {
            id: true,
            reference: true,
            customerName: true,
            customerEmail: true,
            vehicle: { select: { name: true } },
          },
        },
        verifiedBy: { select: { fullName: true } },
      },
    }),
  ]);

  res.json({
    payments,
    pagination: { page: Number(page), pageSize: Number(pageSize), total, totalPages: Math.ceil(total / Number(pageSize)) },
  });
}

export async function downloadReceipt(req: Request, res: Response) {
  const paymentId = String(req.params.paymentId);
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) throw AppError.notFound('Payment not found');

  if (req.user && req.user.role === 'CUSTOMER' && payment.booking.customerId !== req.user.id) {
    throw AppError.notFound('Payment not found');
  }

  await streamPaymentReceipt(res, paymentId);
}

