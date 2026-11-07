import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface AccessPayload {
  sub: string;
  role: UserRole;
  email: string;
}

function readToken(req: Request) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) return h.slice(7);
  return null;
}

async function resolveUser(token: string): Promise<AuthUser> {
  let payload: AccessPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch {
    throw new AppError(401, 'Session expired or invalid token', 'TOKEN_INVALID');
  }
  // Make sure the account still exists and is active (role changes take effect immediately).
  const user = await prisma.user.findFirst({
    where: { id: payload.sub, isActive: true, deletedAt: null },
    select: { id: true, role: true, email: true },
  });
  if (!user) throw AppError.unauthorized('Account not found or disabled');
  return user;
}

/** Requires a valid access token. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next(AppError.unauthorized());
  try {
    req.user = await resolveUser(token);
    next();
  } catch (e) {
    next(e);
  }
}

/** Attaches the user when a token is present, otherwise continues anonymously. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = await resolveUser(token);
  } catch {
    /* ignore */
  }
  next();
}

/** Role-based access control. */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };

export const requireStaff = requireRole('ADMIN', 'STAFF');
export const requireAdmin = requireRole('ADMIN');

export const isStaff = (u?: AuthUser) => !!u && (u.role === 'ADMIN' || u.role === 'STAFF');

