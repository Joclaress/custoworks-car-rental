import { z } from 'zod';
import { RentalType, RateDuration, PricingUnit, FeeType, VehicleCategory, DiscountType } from '@prisma/client';

export const quoteQuerySchema = z.object({
  vehicleId: z.string().uuid(),
  destinationId: z.string().uuid(),
  rentalType: z.nativeEnum(RentalType),
  pickupAt: z.string().datetime({ offset: true }),
  returnAt: z.string().datetime({ offset: true }),
  pickupMethod: z.enum(['OFFICE', 'DELIVERY']).default('OFFICE'),
  deliveryZoneId: z.string().uuid().optional().nullable(),
  surchargeIds: z.union([z.array(z.string().uuid()), z.string().uuid().transform((v) => [v])]).optional(),
  promoCode: z.string().trim().optional().nullable(),
  unliMileage: z.coerce.boolean().optional(),
});

export const updateRateMatrixSchema = z.object({
  rates: z.array(
    z.object({
      id: z.string().uuid().optional(),
      destinationId: z.string().uuid(),
      rentalType: z.nativeEnum(RentalType),
      duration: z.nativeEnum(RateDuration),
      pricingUnit: z.nativeEnum(PricingUnit).default(PricingUnit.PER_DAY),
      amount: z.coerce.number().min(0).nullable().optional(),
      isPublished: z.boolean().default(false),
      notes: z.string().trim().max(300).optional().nullable(),
    })
  ),
});

export const destinationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const additionalFeeSchema = z.object({
  code: z.string().trim().min(2).max(80).optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional().nullable(),
  type: z.nativeEnum(FeeType).default(FeeType.OTHER),
  amount: z.coerce.number().min(0),
  vehicleCategory: z.nativeEnum(VehicleCategory).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const promotionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().max(30).optional().nullable(),
  description: z.string().trim().max(300).optional().nullable(),
  discountType: z.nativeEnum(DiscountType),
  value: z.coerce.number().min(0),
  vehicleId: z.string().uuid().optional().nullable(),
  rentalType: z.nativeEnum(RentalType).optional().nullable(),
  minDays: z.coerce.number().int().min(1).optional().nullable(),
  startsAt: z.string().datetime({ offset: true }).optional().nullable(),
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
  autoApply: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

