import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as c from './files.controller';

export const fileRoutes = Router();

fileRoutes.get('/requirements/:docId', authenticate, c.viewRequirementDocument);
fileRoutes.get('/payments/:paymentId/proof', authenticate, c.viewPaymentProof);

