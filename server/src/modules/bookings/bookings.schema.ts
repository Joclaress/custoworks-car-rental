import { z } from 'zod';
import { RentalType, BookingStatus, BookingRequestType } from '@prisma/client';
import { phoneSchema } from '../auth/auth.schema';

export const draftBookingSchema = z.object({
  vehicleId: z.string().uuid(),
  destinationId: z.string().uuid(),
  rentalType: z.nativeEnum(RentalType),
  pickupAt: z.string().datetime({ offset: true }),
  returnAt: z.string().datetime({ offset: true }),
  pickupMethod: z.enum(['OFFICE', 'DELIVERY']).default('OFFICE'),
  deliveryZoneId: z.string().uuid().optional().nullable(),
  surchargeIds: z.array(z.string().uuid()).optional(),
  promoCode: z.string().trim().optional().nullable(),
  unliMileage: z.boolean().optional(),
  customer: z
    .object({
      customerName: z.string().trim().min(2).max(120).optional(),
      customerEmail: z.string().trim().email().optional(),
      customerPhone: phoneSchema.optional(),
      customerAddress: z.string().trim().max(300).optional(),
      emergencyContactName: z.string().trim().max(120).optional(),
      emergencyContactPhone: z.string().trim().max(30).optional(),
      purpose: z.string().trim().max(300).optional(),
    })
    .optional(),
});

export const updateDraftSchema = draftBookingSchema.partial().extend({
  deliveryAddress: z.string().trim().max(300).optional().nullable(),
});

export const bookingFilterSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  vehicleId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const requestActionSchema = z.object({
  type: z.nativeEnum(BookingRequestType),
  requestedPickupAt: z.string().datetime({ offset: true }).optional(),
  requestedReturnAt: z.string().datetime({ offset: true }).optional(),
  reason: z.string().trim().min(3).max(500),
});

export const adminRescheduleSchema = z.object({
  pickupAt: z.string().datetime({ offset: true }),
  returnAt: z.string().datetime({ offset: true }),
  reprice: z.boolean().default(true),
});

export const bookingNoteSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export const handleRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  adminResponse: z.string().trim().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(2).max(500),
});

