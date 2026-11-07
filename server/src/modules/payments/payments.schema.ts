import { z } from 'zod';
import { PaymentType, PaymentMethodKind } from '@prisma/client';

export const submitPaymentSchema = z.object({
  paymentMethodId: z.string().uuid(),
  referenceNumber: z.string().trim().min(3).max(100),
  idempotencyKey: z.string().trim().max(100).optional(),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const recordPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  type: z.nativeEnum(PaymentType),
  amount: z.coerce.number().positive(),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  paidAt: z.string().datetime({ offset: true }).optional(),
});

export const paymentMethodSchema = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(100),
  kind: z.nativeEnum(PaymentMethodKind),
  accountName: z.string().trim().max(100).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
  instructions: z.string().trim().max(1000).optional().nullable(),
  isCustomerSelectable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

