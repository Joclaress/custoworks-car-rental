import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .regex(/^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/, 'Enter a valid PH mobile number (e.g. 0995 382 7972)');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: phone.optional(),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  province: z.string().trim().max(100).optional().nullable(),
  emergencyContactName: z.string().trim().max(120).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(30).optional().nullable(),
  emergencyContactRelation: z.string().trim().max(60).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: registerSchema.shape.password,
});

export { phone as phoneSchema };

