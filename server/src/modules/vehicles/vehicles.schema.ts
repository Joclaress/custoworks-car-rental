import { z } from 'zod';
import { VehicleCategory, Transmission, VehicleStatus } from '@prisma/client';

export const vehicleFilterSchema = z.object({
  category: z.nativeEnum(VehicleCategory).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  rentalType: z.enum(['SELF_DRIVE', 'WITH_DRIVER']).optional(),
  search: z.string().trim().optional(),
  availableFrom: z.string().datetime({ offset: true }).optional(),
  availableTo: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const createVehicleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.nativeEnum(VehicleCategory),
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  year: z.coerce.number().int().min(1990).max(2035).optional().nullable(),
  transmission: z.nativeEnum(Transmission),
  seats: z.coerce.number().int().min(1).max(30),
  fuelType: z.string().trim().max(30).optional().nullable(),
  color: z.string().trim().max(30).optional().nullable(),
  plateNumber: z.string().trim().max(20).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  features: z.array(z.string().trim()).default([]),
  allowSelfDrive: z.boolean().default(true),
  allowWithDriver: z.boolean().default(true),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateVehicleSchema = createVehicleSchema.partial();

