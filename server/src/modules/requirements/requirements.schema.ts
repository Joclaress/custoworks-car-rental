import { z } from 'zod';
import { RequirementAppliesTo } from '@prisma/client';

export const reviewRequirementSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_REUPLOAD']),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const requirementTypeSchema = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  appliesTo: z.nativeEnum(RequirementAppliesTo),
  isRequired: z.boolean().default(true),
  options: z.array(z.string().trim()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

