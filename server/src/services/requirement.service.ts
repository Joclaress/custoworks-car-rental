import path from 'path';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { saveFile } from './storage.service';
import { requirementSummary, syncRequirementStage, TERMINAL } from './booking.service';
import { verifyDocumentLegitimacy } from './ai-verification.service';

export async function uploadRequirementDocument(
  user: { id: string | null; isStaff: boolean },
  bookingId: string,
  requirementId: string,
  file: Express.Multer.File | undefined,
  selectedOption?: string | null,
) {
  if (!file) throw AppError.badRequest('Please choose a file to upload');
  const req = await prisma.bookingRequirement.findUnique({
    where: { id: requirementId },
    include: { booking: true, requirementType: true },
  });
  if (!req || req.bookingId !== bookingId) throw AppError.notFound('Requirement not found');
  if (user.id && !user.isStaff && req.booking.customerId !== user.id) throw AppError.notFound('Requirement not found');
  if (TERMINAL.includes(req.booking.status) || req.booking.status === 'ONGOING')
    throw AppError.conflict('Documents can no longer be uploaded for this booking');
  if (req.status === 'APPROVED') throw AppError.conflict('This requirement has already been approved');
  const options = req.requirementType.options;
  const finalOption =
    selectedOption && options.includes(selectedOption)
      ? selectedOption
      : options.length > 0
      ? options[0]
      : null;

  const effectiveActorId = user.id || req.booking.customerId;
  const stored = await saveFile(file, { folder: `requirements/${bookingId}`, visibility: 'private' });
  const localPrivateDir = path.resolve(process.cwd(), './uploads/private');
  const absPath = path.join(localPrivateDir, stored.key);

  // Run AI legitimacy and fraud detection check
  const aiResult = await verifyDocumentLegitimacy(
    absPath,
    file.mimetype,
    req.requirementType.code,
    req.booking.customerName
  );

  const result = await prisma.$transaction(async (tx) => {
    await tx.requirementDocument.updateMany({
      where: { bookingRequirementId: req.id, status: 'PENDING_REVIEW' },
      data: { status: 'SUPERSEDED' },
    });
    const doc = await tx.requirementDocument.create({
      data: {
        bookingRequirementId: req.id,
        uploadedById: effectiveActorId,
        storageProvider: stored.provider,
        storageKey: stored.key,
        originalName: file.originalname.slice(0, 200),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        selectedOption: finalOption,
      },
    });
    await tx.bookingRequirement.update({
      where: { id: req.id },
      data: { status: 'SUBMITTED', rejectionReason: null, reviewedAt: null },
    });
    await tx.requirementReview.create({
      data: {
        bookingRequirementId: req.id,
        documentId: doc.id,
        action: 'SUBMITTED',
        actorId: effectiveActorId,
        reason: `[AI ${aiResult.verdict} | ${aiResult.confidence}%] ${aiResult.analysisSummary}`,
      },
    });
    await tx.bookingNote.create({
      data: {
        bookingId,
        authorId: effectiveActorId,
        body: `[AI Verification: ${aiResult.verdict}] ${req.name}: ${aiResult.documentTypeDetected} (${aiResult.confidence}% confidence, ${aiResult.engine}). ${aiResult.analysisSummary}`,
      },
    });
    await syncRequirementStage(tx, bookingId, effectiveActorId);
    const summary = await requirementSummary(tx, bookingId);
    return { doc, summary, aiVerification: aiResult };
  });
  return { ...result, booking: req.booking, requirement: req };
}

export async function reviewRequirement(
  actorId: string,
  requirementId: string,
  input: { action: 'APPROVE' | 'REJECT' | 'REQUEST_REUPLOAD'; reason?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.bookingRequirement.findUnique({
      where: { id: requirementId },
      include: { documents: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!req) throw AppError.notFound('Requirement not found');
    const latest = req.documents[0];
    if (input.action === 'APPROVE') {
      await tx.bookingRequirement.update({
        where: { id: req.id },
        data: { status: 'APPROVED', rejectionReason: null, reviewedAt: new Date() },
      });
      if (latest) {
        await tx.requirementDocument.update({ where: { id: latest.id }, data: { status: 'APPROVED' } });
      }
    } else {
      if (!input.reason) throw AppError.badRequest('Please provide a reason');
      await tx.bookingRequirement.update({
        where: { id: req.id },
        data: {
          status: input.action === 'REJECT' ? 'REJECTED' : 'REUPLOAD_REQUESTED',
          rejectionReason: input.reason,
          reviewedAt: new Date(),
        },
      });
      if (latest && latest.status === 'PENDING_REVIEW')
        await tx.requirementDocument.update({ where: { id: latest.id }, data: { status: 'REJECTED' } });
      else if (latest && latest.status === 'APPROVED')
        await tx.requirementDocument.update({ where: { id: latest.id }, data: { status: 'REJECTED' } });
    }
    await tx.requirementReview.create({
      data: {
        bookingRequirementId: req.id,
        documentId: latest?.id,
        action: input.action === 'APPROVE' ? 'APPROVED' : input.action === 'REJECT' ? 'REJECTED' : 'REUPLOAD_REQUESTED',
        reason: input.reason,
        actorId,
      },
    });
    await syncRequirementStage(tx, req.bookingId, actorId);
    const summary = await requirementSummary(tx, req.bookingId);
    return { requirement: req, summary };
  });
}

