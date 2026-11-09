import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:4000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/custoworks?schema=public'),
  JWT_ACCESS_SECRET: z
    .string()
    .optional()
    .transform((val) => (val && val.length >= 32 ? val : 'custoworks-jwt-access-secret-production-2026-naga-city-ph')),
  JWT_REFRESH_SECRET: z
    .string()
    .optional()
    .transform((val) => (val && val.length >= 32 ? val : 'custoworks-jwt-refresh-secret-production-2026-naga-city-ph')),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),
  APP_TIMEZONE: z.string().default('Asia/Manila'),
  STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  LOCAL_UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(5),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('custoworks'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v === 'true';
      return false; // port 587 uses STARTTLS (secure = false)
    }),
  SMTP_USER: z.string().default('custoworks1@gmail.com'),
  SMTP_PASS: z.string().default('fzataexaujzygovd'),
  MAIL_FROM: z.string().default('Custoworks Car Rental <custoworks1@gmail.com>'),
  ADMIN_NOTIFY_EMAIL: z.string().optional(),
  SMS_PROVIDER: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_NAME: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

