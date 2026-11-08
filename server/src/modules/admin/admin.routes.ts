import { Router } from 'express';
import { authenticate, requireStaff, requireAdmin } from '../../middleware/auth';
import * as c from './admin.controller';

export const adminRoutes = Router();

adminRoutes.get('/stats', authenticate, requireStaff, c.getDashboardStats);
adminRoutes.get('/settings', authenticate, requireStaff, c.getAdminSettings);
adminRoutes.put('/settings', authenticate, requireAdmin, c.updateAdminSettings);
adminRoutes.post('/reset-test-data', authenticate, requireAdmin, c.resetTestData);
adminRoutes.get('/audit-logs', authenticate, requireAdmin, c.getAuditLogs);
adminRoutes.get('/notifications', authenticate, requireStaff, c.getAdminNotifications);
adminRoutes.patch('/notifications/:id/read', authenticate, requireStaff, c.markNotificationRead);

// Staff & Admin user management (Admin only)
adminRoutes.get('/users', authenticate, requireAdmin, c.getAdminUsers);
adminRoutes.post('/users', authenticate, requireAdmin, c.createAdminUser);
adminRoutes.patch('/users/:id', authenticate, requireAdmin, c.updateAdminUser);
adminRoutes.delete('/users/:id', authenticate, requireAdmin, c.deleteAdminUser);

