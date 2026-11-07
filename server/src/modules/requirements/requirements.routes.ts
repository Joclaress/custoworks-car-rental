import { Router } from 'express';
import { authenticate, optionalAuth, requireStaff } from '../../middleware/auth';
import { uploadDocument as multerUploadDoc } from '../../middleware/upload';
import { uploadLimiter } from '../../middleware/rateLimit';
import * as c from './requirements.controller';

export const requirementRoutes = Router();

// Upload document for a booking requirement slot (guest or authenticated)
requirementRoutes.post(
  '/booking/:bookingId/upload/:requirementId',
  optionalAuth,
  uploadLimiter,
  multerUploadDoc,
  c.uploadDocument
);

// Admin review
requirementRoutes.post('/:requirementId/review', authenticate, requireStaff, c.adminReviewRequirement);
requirementRoutes.post('/:requirementId/ai-verify', authenticate, requireStaff, c.adminAiVerifyRequirement);

// Requirement types management
requirementRoutes.get('/types', c.listRequirementTypes);
requirementRoutes.post('/types', authenticate, requireStaff, c.createRequirementType);
requirementRoutes.patch('/types/:id', authenticate, requireStaff, c.updateRequirementType);

