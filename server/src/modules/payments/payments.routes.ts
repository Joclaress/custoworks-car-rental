import { Router } from 'express';
import { authenticate, optionalAuth, requireStaff } from '../../middleware/auth';
import { uploadDocument, uploadImage } from '../../middleware/upload';
import { uploadLimiter } from '../../middleware/rateLimit';
import * as c from './payments.controller';

export const paymentRoutes = Router();

// Public payment methods (GCash, BPI, BDO)
paymentRoutes.get('/methods', c.listPublicPaymentMethods);

// Customer upload payment receipt (guest or authenticated)
paymentRoutes.post('/reservation/:bookingId', optionalAuth, uploadLimiter, uploadDocument, c.submitPaymentProof);
paymentRoutes.get('/:paymentId/receipt', optionalAuth, c.downloadReceipt);

// Admin payments management
paymentRoutes.get('/admin/all', authenticate, requireStaff, c.adminListPayments);
paymentRoutes.post('/:id/approve', authenticate, requireStaff, c.adminApprovePayment);
paymentRoutes.post('/:id/reject', authenticate, requireStaff, c.adminRejectPayment);
paymentRoutes.post('/record-otc', authenticate, requireStaff, c.adminRecordPayment);

// Admin payment methods management
paymentRoutes.get('/admin/methods', authenticate, requireStaff, c.adminListPaymentMethods);
paymentRoutes.post('/methods', authenticate, requireStaff, c.createPaymentMethod);
paymentRoutes.patch('/methods/:id', authenticate, requireStaff, c.updatePaymentMethod);
paymentRoutes.post('/methods/:id/qr', authenticate, requireStaff, uploadImage, c.uploadPaymentMethodQr);

