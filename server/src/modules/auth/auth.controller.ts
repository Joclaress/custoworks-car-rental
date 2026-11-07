import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { parse } from '../../middleware/error';
import { audit } from '../../services/audit.service';
import { changePasswordSchema, loginSchema, profileSchema, registerSchema } from './auth.schema';
import {
  REFRESH_COOKIE,
  hashPassword,
  issueRefreshToken,
  publicUser,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  verifyPassword,
} from './auth.service';

const cookieOpts = (expires: Date): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/api/auth',
  expires,
});

const meta = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent') });

export async function register(req: Request, res: Response) {
  const data = parse(registerSchema, req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw AppError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  const user = await prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      passwordHash: await hashPassword(data.password),
      role: 'CUSTOMER',
      profile: { create: {} },
    },
    include: { profile: true },
  });
  await audit({ actorId: user.id, action: 'auth.register', entityType: 'user', entityId: user.id, req });
  const refresh = await issueRefreshToken(user.id, meta(req));
  res.cookie(REFRESH_COOKIE, refresh.raw, cookieOpts(refresh.expiresAt));
  res.status(201).json({ user: publicUser(user), accessToken: signAccessToken(user) });
}

export async function login(req: Request, res: Response) {
  const data = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email }, include: { profile: true } });
  // constant-ish time: always run bcrypt
  const ok = await verifyPassword(data.password, user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok || !user.isActive || user.deletedAt) throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const refresh = await issueRefreshToken(user.id, meta(req));
  res.cookie(REFRESH_COOKIE, refresh.raw, cookieOpts(refresh.expiresAt));
  res.json({ user: publicUser(user), accessToken: signAccessToken(user) });
}

export async function refresh(req: Request, res: Response) {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) throw AppError.unauthorized('No session');
  const r = await rotateRefreshToken(raw, meta(req));
  res.cookie(REFRESH_COOKIE, r.refresh.raw, cookieOpts(r.refresh.expiresAt));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: r.user.id }, include: { profile: true } });
  res.json({ user: publicUser(user), accessToken: r.accessToken });
}

export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (raw) await revokeRefreshToken(raw);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, include: { profile: true } });
  res.json({ user: publicUser(user) });
}

export async function updateProfile(req: Request, res: Response) {
  const data = parse(profileSchema, req.body);
  const { fullName, phone, ...profile } = data;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      profile: { upsert: { create: profile, update: profile } },
    },
    include: { profile: true },
  });
  res.json({ user: publicUser(user) });
}

export async function changePassword(req: Request, res: Response) {
  const data = parse(changePasswordSchema, req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!(await verifyPassword(data.currentPassword, user.passwordHash))) throw AppError.badRequest('Current password is incorrect');
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.newPassword) } });
  await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit({ actorId: user.id, action: 'auth.change_password', entityType: 'user', entityId: user.id, req });
  res.json({ ok: true });
}

