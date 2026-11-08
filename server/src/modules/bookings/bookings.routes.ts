import { Router } from 'express';
import { authenticate, optionalAuth, requireStaff } from '../../middleware/auth';
import { bookingLimiter } from '../../middleware/rateLimit';
import * as c from './bookings.controller';

export const bookingRoutes = Router();

// Public Customer Tracking (by official tracking / reference number)
bookingRoutes.get('/track/:reference', c.trackBooking);
bookingRoutes.get('/track/:reference/agreement', c.downloadTrackAgreement);
bookingRoutes.post('/track/:reference/request', c.createTrackCustomerRequest);

// Customer Draft & Submit (guest or authenticated)
bookingRoutes.post('/draft', optionalAuth, bookingLimiter, c.createDraftBooking);
bookingRoutes.patch('/:id/draft', optionalAuth, c.updateDraftBooking);
bookingRoutes.post('/:id/submit', optionalAuth, c.submitBooking);

// Customer bookings & details
bookingRoutes.get('/my', authenticate, c.listMyBookings);
bookingRoutes.get('/:id', optionalAuth, c.getBookingById);
bookingRoutes.get('/:id/agreement', optionalAuth, c.downloadAgreement);

// Customer requests (Reschedule / Cancellation)
bookingRoutes.post('/:id/request', authenticate, c.createCustomerRequest);
bookingRoutes.post('/:id/cancel', authenticate, c.cancelBooking);

// Admin / Staff Booking Management
bookingRoutes.get('/admin/all', authenticate, requireStaff, c.adminListBookings);
bookingRoutes.get('/admin/dispatch-schedule', authenticate, requireStaff, c.getAdminDispatchSchedule);
bookingRoutes.delete('/:id', authenticate, requireStaff, c.deleteBooking);
bookingRoutes.post('/:id/confirm', authenticate, requireStaff, c.confirmBooking);
bookingRoutes.post('/:id/release', authenticate, requireStaff, c.releaseVehicle);
bookingRoutes.post('/:id/complete', authenticate, requireStaff, c.completeRental);
bookingRoutes.post('/:id/reschedule', authenticate, requireStaff, c.adminReschedule);
bookingRoutes.post('/:id/notes', authenticate, requireStaff, c.addBookingNote);
bookingRoutes.post('/requests/:requestId/handle', authenticate, requireStaff, c.handleCustomerRequest);

