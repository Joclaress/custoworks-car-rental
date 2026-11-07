import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { sendPrivateFile } from '../../services/storage.service';

export async function viewRequirementDocument(req: Request, res: Response) {
  const docId = String(req.params.docId);
  const doc = await prisma.requirementDocument.findUnique({
    where: { id: docId },
    include: {
      bookingRequirement: {
        include: { booking: true },
      },
    },
  });

  if (!doc) throw AppError.notFound('Document not found');

  const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'STAFF';
  const isOwner = doc.bookingRequirement.booking.customerId === req.user!.id;
  if (!isStaff && !isOwner) throw AppError.notFound('Document not found');

  await sendPrivateFile(res, doc.storageProvider, doc.storageKey, doc.mimeType);
}

export async function viewPaymentProof(req: Request, res: Response) {
  const paymentId = String(req.params.paymentId);
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });

  if (!payment || !payment.proofStorageKey) throw AppError.notFound('Payment receipt proof not found');

  const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'STAFF';
  const isOwner = payment.booking.customerId === req.user!.id;
  if (!isStaff && !isOwner) throw AppError.notFound('Payment proof not found');

  await sendPrivateFile(
    res,
    payment.proofStorageProvider || 'local',
    payment.proofStorageKey,
    payment.proofMimeType || 'image/jpeg'
  );
}

