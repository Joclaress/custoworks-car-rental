import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../lib/errors';
import { isProd } from '../config/env';

/** Parse & validate input with a zod schema; throws a 422 AppError on failure. */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issues = r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    const first = issues[0];
    let specificMessage = 'Validation failed';
    if (first) {
      const isPhone = first.path.toLowerCase().includes('phone');
      const isEmail = first.path.toLowerCase().includes('email');
      const isName = first.path.toLowerCase().includes('name');
      const isAddress = first.path.toLowerCase().includes('address');

      if (isPhone) {
        specificMessage = 'Philippine mobile number is incorrect (must be 11 digits starting with 09, e.g. 09953827972)';
      } else if (isEmail) {
        specificMessage = `Email address is invalid: ${first.message}`;
      } else if (isName) {
        specificMessage = `Full name is required: ${first.message}`;
      } else if (isAddress) {
        specificMessage = `Address is required: ${first.message}`;
      } else {
        specificMessage = `${first.path}: ${first.message}`;
      }
    }
    throw AppError.unprocessable(specificMessage, issues);
  }
  return r.data;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let body: { error: { code: string; message: string; details?: unknown } } = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  };

  if (err instanceof AppError) {
    status = err.statusCode;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if (err instanceof ZodError) {
    status = 422;
    body = {
      error: {
        code: 'UNPROCESSABLE',
        message: 'Validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    };
  } else if (err instanceof multer.MulterError) {
    status = 400;
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    body = { error: { code: 'UPLOAD_ERROR', message: msg } };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      body = { error: { code: 'DUPLICATE', message: 'A record with the same unique value already exists' } };
    } else if (err.code === 'P2025') {
      status = 404;
      body = { error: { code: 'NOT_FOUND', message: 'Resource not found' } };
    } else if (err.code === 'P2003') {
      status = 409;
      body = { error: { code: 'IN_USE', message: 'This record is referenced by other records' } };
    }
  } else if (isOverlapViolation(err)) {
    status = 409;
    body = {
      error: { code: 'VEHICLE_UNAVAILABLE', message: 'The vehicle is no longer available for the selected schedule.' },
    };
  } else if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    status = 400;
    body = { error: { code: 'BAD_JSON', message: 'Malformed JSON body' } };
  }

  if (status >= 500) console.error('[error]', req.method, req.originalUrl, err);
  if (status >= 500 && !isProd && err instanceof Error) body.error.details = err.message;
  res.status(status).json(body);
}

/** Detects PostgreSQL exclusion (23P01) / unique (23505) violations raised by raw constraints. */
export function isOverlapViolation(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return msg.includes('bookings_no_overlap') || msg.includes('23P01');
}
export function isDuplicatePaymentViolation(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return msg.includes('payments_one_live_reservation_fee') || msg.includes('payments_unique_live_reference');
}

