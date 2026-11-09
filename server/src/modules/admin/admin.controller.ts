import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { getSettings, updateSettings } from '../../services/settings.service';
import { audit } from '../../services/audit.service';
import { paginate } from '../../lib/utils';
import { hashPassword } from '../auth/auth.service';
import { AppError } from '../../lib/errors';
import {
  getAllManualRevenues,
  addManualRevenue as addManualRevenueService,
  deleteManualRevenue as deleteManualRevenueService,
  getManualRevenueStatsForMonth,
} from '../../services/manual-revenue.service';

export async function getDashboardStats(_req: Request, res: Response) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86_400_000);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const [
    todaysBookings,
    pendingReservations,
    confirmedBookings,
    ongoingRentals,
    completedRentals,
    pendingPayments,
    totalVehicles,
    activeRentalsCount,
    revenueData,
    thisMonthRevenueData,
    thisMonthBookingsCount,
    vehiclePayments,
    recentBookings,
    recentPayments,
  ] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
    }),
    prisma.booking.count({
      where: { status: { in: ['PENDING_PAYMENT', 'PAYMENT_VERIFICATION', 'PENDING_REQUIREMENTS', 'REQUIREMENTS_REVIEW'] } },
    }),
    prisma.booking.count({
      where: { status: 'CONFIRMED' },
    }),
    prisma.booking.count({
      where: { status: 'ONGOING' },
    }),
    prisma.booking.count({
      where: { status: 'COMPLETED' },
    }),
    prisma.payment.count({
      where: { status: 'PENDING_VERIFICATION' },
    }),
    prisma.vehicle.count({
      where: { deletedAt: null, isPublished: true },
    }),
    prisma.booking.count({
      where: { status: 'ONGOING' },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'APPROVED',
        type: { in: ['RESERVATION_FEE', 'RENTAL_BALANCE', 'ADDITIONAL_CHARGE'] },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'APPROVED',
        type: { in: ['RESERVATION_FEE', 'RENTAL_BALANCE', 'ADDITIONAL_CHARGE'] },
        OR: [
          { paidAt: { gte: startOfMonth, lt: endOfMonth } },
          { paidAt: null, createdAt: { gte: startOfMonth, lt: endOfMonth } },
        ],
      },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: startOfMonth, lt: endOfMonth },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        type: { in: ['RESERVATION_FEE', 'RENTAL_BALANCE', 'ADDITIONAL_CHARGE'] },
        OR: [
          { paidAt: { gte: startOfMonth, lt: endOfMonth } },
          { paidAt: null, createdAt: { gte: startOfMonth, lt: endOfMonth } },
        ],
      },
      select: {
        amount: true,
        booking: {
          select: {
            vehicleId: true,
            vehicle: {
              select: {
                id: true,
                name: true,
                plateNumber: true,
                category: true,
              },
            },
          },
        },
      },
    }),
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { name: true, plateNumber: true } },
        destination: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        paymentMethod: true,
        booking: { select: { reference: true, customerName: true } },
      },
    }),
  ]);

  const availableVehicles = Math.max(0, totalVehicles - activeRentalsCount);
  const totalRevenue = Number(revenueData._sum.amount || 0);
  const thisMonthRevenue = Number(thisMonthRevenueData._sum.amount || 0);

  // Manual Trip Revenues (e.g. BIA airport pickup/drop, custom chauffeur bookings)
  const manualStats = getManualRevenueStatsForMonth(now.getFullYear(), now.getMonth());
  const combinedThisMonthRevenue = thisMonthRevenue + manualStats.totalGross;
  const combinedTotalRevenue = totalRevenue + manualStats.totalGross;

  // Group vehicle revenues
  const vehicleRevMap = new Map<string, { id: string; name: string; plateNumber: string; category: string; totalRevenue: number; transactionCount: number }>();
  for (const vp of vehiclePayments) {
    const v = vp.booking?.vehicle;
    if (!v) continue;
    const existing = vehicleRevMap.get(v.id) || {
      id: v.id,
      name: v.name,
      plateNumber: v.plateNumber || '',
      category: String(v.category),
      totalRevenue: 0,
      transactionCount: 0,
    };
    existing.totalRevenue += Number(vp.amount);
    existing.transactionCount += 1;
    vehicleRevMap.set(v.id, existing);
  }

  const revenueByVehicle = Array.from(vehicleRevMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

  res.json({
    stats: {
      todaysBookings,
      pendingReservations,
      confirmedBookings,
      ongoingRentals,
      completedRentals,
      pendingPayments,
      totalVehicles,
      availableVehicles,
      totalRevenue: combinedTotalRevenue,
      thisMonthRevenue: combinedThisMonthRevenue,
      onlineThisMonthRevenue: thisMonthRevenue,
      manualThisMonthRevenue: manualStats.totalGross,
      manualStats,
      thisMonthBookingsCount,
      monthLabel,
      revenueByVehicle,
    },
    recentBookings,
    recentPayments,
  });
}

// ----------------------------------------------------------------------------
// Manual Trip Revenue & Expense Logging (BIA Drops, Custom VIP Chauffeur)
// ----------------------------------------------------------------------------

export async function getManualRevenues(_req: Request, res: Response) {
  const revenues = getAllManualRevenues();
  const now = new Date();
  const stats = getManualRevenueStatsForMonth(now.getFullYear(), now.getMonth());
  res.json({ revenues, stats });
}

export async function addManualRevenue(req: Request, res: Response) {
  const entry = addManualRevenueService(req.body);
  const now = new Date();
  const stats = getManualRevenueStatsForMonth(now.getFullYear(), now.getMonth());
  res.status(201).json({ success: true, entry, stats });
}

export async function deleteManualRevenue(req: Request, res: Response) {
  const id = String(req.params.id);
  const success = deleteManualRevenueService(id);
  const now = new Date();
  const stats = getManualRevenueStatsForMonth(now.getFullYear(), now.getMonth());
  res.json({ success, stats });
}

export async function getAdminSettings(_req: Request, res: Response) {
  const settings = await getSettings();
  res.json({ settings });
}

export async function updateAdminSettings(req: Request, res: Response) {
  const updated = await updateSettings(req.body);
  await audit({ actorId: req.user!.id, action: 'settings.update', entityType: 'settings', req });
  res.json({ settings: updated });
}

export async function getAuditLogs(req: Request, res: Response) {
  const { page = 1, pageSize = 30 } = req.query;
  const { skip, take } = paginate({ page, pageSize });

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
      },
    }),
  ]);

  res.json({
    logs,
    pagination: { page: Number(page), pageSize: Number(pageSize), total, totalPages: Math.ceil(total / Number(pageSize)) },
  });
}

export async function getAdminNotifications(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });
  res.json({ notifications });
}

export async function markNotificationRead(req: Request, res: Response) {
  const id = String(req.params.id);
  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
}

// ---------------------------------------------------------------------------
// Staff & Admin User Management
// ---------------------------------------------------------------------------

export async function getAdminUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ users });
}

export async function createAdminUser(req: Request, res: Response) {
  const { email, password, fullName, phone, role } = req.body;

  if (!email || !password || !fullName) {
    throw AppError.badRequest('Email, password, and full name are required');
  }

  if (typeof password !== 'string' || password.length < 6) {
    throw AppError.badRequest('Password must be at least 6 characters');
  }

  const assignedRole = role === 'STAFF' ? 'STAFF' : 'ADMIN';
  const cleanEmail = String(email).trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    throw AppError.conflict('A user with this email address already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      passwordHash,
      fullName: String(fullName).trim(),
      phone: phone ? String(phone).trim() : null,
      role: assignedRole,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await audit({ actorId: req.user!.id, action: 'user.create_admin', entityType: 'user', entityId: user.id, req });
  res.status(201).json({ user });
}

export async function updateAdminUser(req: Request, res: Response) {
  const id = String(req.params.id);
  const { fullName, phone, role, isActive, password } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt) {
    throw AppError.notFound('User not found');
  }

  // Prevent self-demotion or self-deactivation
  if (req.user!.id === id) {
    if (isActive === false) throw AppError.badRequest('You cannot deactivate your own account.');
    if (role && role !== 'ADMIN') throw AppError.badRequest('You cannot demote your own account.');
  }

  const data: Record<string, any> = {};
  if (fullName !== undefined) data.fullName = String(fullName).trim();
  if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
  if (role && ['ADMIN', 'STAFF', 'CUSTOMER'].includes(role)) data.role = role;
  if (typeof isActive === 'boolean') data.isActive = isActive;
  if (password && typeof password === 'string' && password.trim().length >= 6) {
    data.passwordHash = await hashPassword(password.trim());
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  await audit({ actorId: req.user!.id, action: 'user.update', entityType: 'user', entityId: id, req });
  res.json({ user: updated });
}

export async function deleteAdminUser(req: Request, res: Response) {
  const id = String(req.params.id);

  if (req.user!.id === id) {
    throw AppError.badRequest('You cannot delete your own account.');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt) {
    throw AppError.notFound('User not found');
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });

  await audit({ actorId: req.user!.id, action: 'user.delete', entityType: 'user', entityId: id, req });
  res.json({ success: true, message: 'User account removed.' });
}

export async function resetTestData(req: Request, res: Response) {
  await prisma.$transaction(async (tx) => {
    await tx.bookingStatusHistory.deleteMany({});
    await tx.bookingNote.deleteMany({});
    await tx.bookingFee.deleteMany({});
    await tx.requirementReview.deleteMany({});
    await tx.requirementDocument.deleteMany({});
    await tx.bookingRequirement.deleteMany({});
    await tx.rentalAgreement.deleteMany({});
    await tx.payment.deleteMany({});
    await tx.booking.deleteMany({});
    await tx.bookingRequest.deleteMany({});
    await tx.partnerApplication.deleteMany({});
    await tx.notification.deleteMany({});
    await tx.auditLog.deleteMany({});
    await tx.vehicleAvailability.deleteMany({});
  });

  await audit({ actorId: req.user!.id, action: 'system.reset_data', entityType: 'system', entityId: 'all', req });

  res.json({ success: true, message: 'All sample/test transactional records have been purged.' });
}


