import { Router } from 'express';
import { authenticate, requireStaff } from '../../middleware/auth';
import * as c from './calendar.controller';

export const calendarRoutes = Router();

// Public vehicle availability calendar
calendarRoutes.get('/vehicle/:vehicleId', c.getVehiclePublicCalendar);

// Admin full-screen calendar
calendarRoutes.get('/admin/events', authenticate, requireStaff, c.getAdminCalendarEvents);
calendarRoutes.post('/admin/blocks', authenticate, requireStaff, c.createMaintenanceBlock);
calendarRoutes.delete('/admin/blocks/:id', authenticate, requireStaff, c.deleteMaintenanceBlock);
calendarRoutes.post('/admin/reschedule-drag', authenticate, requireStaff, c.adminDragReschedule);

