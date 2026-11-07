import path from 'path';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { parse } from '../../middleware/error';
import { audit } from '../../services/audit.service';
import { notifyAdmin, notifyBooking } from '../../services/notification.service';
import { reviewRequirement, uploadRequirementDocument } from '../../services/requirement.service';
import { verifyDocumentLegitimacy } from '../../services/ai-verification.service';
import { requirementTypeSchema, reviewRequirementSchema } from './requirements.schema';

export async function uploadDocument(req: Request, res: Response) {
  const bookingId = String(req.params.bookingId);
  const requirementId = String(req.params.requirementId);
  const selectedOption = req.body?.selectedOption;
  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';

  const result = await uploadRequirementDocument(
    { id: req.user?.id || null, isStaff },
    bookingId,
    requirementId,
    req.file,
    selectedOption
  );

  const actorId = req.user?.id || result.booking.customerId;
  await audit({
    actorId,
    action: 'requirement.upload',
    entityType: 'booking_requirement',
    entityId: requirementId,
    details: { documentId: result.doc.id, filename: result.doc.originalName },
    req,
  });

  await notifyAdmin(
    `New Requirement Uploaded for ${result.booking.reference}`,
    `Document uploaded for "${result.requirement.name}".`
  );

  res.status(201).json(result);
}

export async function adminReviewRequirement(req: Request, res: Response) {
  const requirementId = String(req.params.requirementId);
  const data = parse(reviewRequirementSchema, req.body);

  const result = await reviewRequirement(req.user!.id, requirementId, data);

  await audit({
    actorId: req.user!.id,
    action: `requirement.${data.action.toLowerCase()}`,
    entityType: 'booking_requirement',
    entityId: requirementId,
    details: data,
    req,
  });

  const reqDoc = await prisma.bookingRequirement.findUnique({
    where: { id: requirementId },
    include: { booking: true },
  });

  if (reqDoc) {
    if (data.action === 'APPROVE') {
      if (result.summary.allApproved) {
        await notifyBooking('REQUIREMENTS_APPROVED', reqDoc.bookingId);
      }
    } else {
      await notifyBooking('REQUIREMENT_REJECTED', reqDoc.bookingId, {
        name: reqDoc.name,
        reason: data.reason || undefined,
      });
    }
  }

  res.json(result);
}

export async function adminAiVerifyRequirement(req: Request, res: Response) {
  const requirementId = String(req.params.requirementId);
  const requirement = await prisma.bookingRequirement.findUnique({
    where: { id: requirementId },
    include: {
      booking: true,
      requirementType: true,
      documents: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!requirement) throw AppError.notFound('Requirement not found');
  const latestDoc = requirement.documents[0];
  if (!latestDoc) throw AppError.badRequest('No document uploaded for this requirement yet');

  const localPrivateDir = path.resolve(process.cwd(), './uploads/private');
  const absPath = path.join(localPrivateDir, latestDoc.storageKey);

  const aiResult = await verifyDocumentLegitimacy(
    absPath,
    latestDoc.mimeType,
    requirement.requirementType.code,
    requirement.booking.customerName
  );

  await prisma.requirementReview.create({
    data: {
      bookingRequirementId: requirement.id,
      documentId: latestDoc.id,
      action: 'SUBMITTED',
      actorId: req.user!.id,
      reason: `[AI Re-Scan: ${aiResult.verdict} | ${aiResult.confidence}%] ${aiResult.analysisSummary}`,
    },
  });

  await prisma.bookingNote.create({
    data: {
      bookingId: requirement.bookingId,
      authorId: req.user!.id,
      body: `[Admin Triggered AI Scan] ${requirement.name}: ${aiResult.verdict} (${aiResult.confidence}% confidence). ${aiResult.analysisSummary}`,
    },
  });

  res.json({ aiVerification: aiResult });
}

export async function listRequirementTypes(_req: Request, res: Response) {
  const types = await prisma.requirementType.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ types });
}

export async function createRequirementType(req: Request, res: Response) {
  const data = parse(requirementTypeSchema, req.body);
  const type = await prisma.requirementType.create({ data });
  await audit({ actorId: req.user!.id, action: 'requirement_type.create', entityType: 'requirement_type', entityId: type.id, req });
  res.status(201).json({ type });
}

export async function updateRequirementType(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(requirementTypeSchema.partial(), req.body);
  const type = await prisma.requirementType.update({ where: { id }, data });
  await audit({ actorId: req.user!.id, action: 'requirement_type.update', entityType: 'requirement_type', entityId: id, req });
  res.json({ type });
}

