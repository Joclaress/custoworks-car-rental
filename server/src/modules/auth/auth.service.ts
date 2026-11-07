import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { User } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { sha256 } from '../../lib/utils';

export const REFRESH_COOKIE = 'cw_refresh';

export function publicUser(u: User & { profile?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, deletedAt, ...rest } = u;
  return rest;
}

export function signAccessToken(u: Pick<User, 'id' | 'role' | 'email'>) {
  return jwt.sign({ sub: u.id, role: u.role, email: u.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export async function issueRefreshToken(userId: string, meta: { ip?: string; userAgent?: string }) {
  const raw = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 86_400_000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: sha256(raw + env.JWT_REFRESH_SECRET), expiresAt, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 300) },
  });
  return { raw, expiresAt };
}

/** Rotates a refresh token. Re-use of a revoked token revokes the whole family (all sessions). */
export async function rotateRefreshToken(raw: string, meta: { ip?: string; userAgent?: string }) {
  const tokenHash = sha256(raw + env.JWT_REFRESH_SECRET);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!existing) throw AppError.unauthorized('Invalid session');
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({ where: { userId: existing.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    throw AppError.unauthorized('Session revoked. Please log in again.');
  }
  if (existing.expiresAt < new Date()) throw AppError.unauthorized('Session expired. Please log in again.');
  if (!existing.user.isActive || existing.user.deletedAt) throw AppError.unauthorized('Account disabled');
  await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  const next = await issueRefreshToken(existing.userId, meta);
  return { user: existing.user, refresh: next, accessToken: signAccessToken(existing.user) };
}

export async function revokeRefreshToken(raw: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(raw + env.JWT_REFRESH_SECRET), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

