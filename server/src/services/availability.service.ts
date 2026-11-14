import type { BookingStatus } from '@prisma/client';
import { prisma, type Tx } from '../lib/prisma';
import { AppError } from '../lib/errors';

/** Statuses that occupy the vehicle on the calendar (mirrors the DB exclusion constraint). Only confirmed and ongoing bookings lock slots. */
export const ACTIVE_STATUSES: BookingStatus[] = [
  'CONFIRMED',
  'ONGOING',
];

/** Customer-facing calendar buckets + colours. */
export type CalendarState = 'PENDING' | 'RESERVED' | 'ONGOING' | 'RETURNED' | 'MAINTENANCE';
export function calendarState(status: BookingStatus): CalendarState {
  if (status === 'ONGOING') return 'ONGOING';
  if (status === 'COMPLETED') return 'RETURNED';
  if (status === 'CONFIRMED') return 'RESERVED';
  return 'PENDING';
}

/**
 * Expire holds whose time window has passed. Called by the cron job and,
 * for a single vehicle, inside the booking transaction so stale holds never
 * block a new customer.
 */
export async function expireStaleHolds(db: Tx | typeof prisma = prisma, vehicleId?: string) {
  const stale = await db.booking.findMany({
    where: {
      status: { in: ['DRAFT', 'PENDING_PAYMENT'] },
      holdExpiresAt: { lt: new Date() },
      ...(vehicleId ? { vehicleId } : {}),
    },
    select: { id: true, status: true },
  });
  if (!stale.length) return [];
  await db.booking.updateMany({ where: { id: { in: stale.map((s) => s.id) } }, data: { status: 'EXPIRED', holdExpiresAt: null } });
  await db.bookingStatusHistory.createMany({
    data: stale.map((s) => ({ bookingId: s.id, fromStatus: s.status, toStatus: 'EXPIRED' as const, note: 'Hold expired automatically' })),
  });
  return stale;
}

/**
 * Serialises booking writes per vehicle with a transaction-scoped advisory lock,
 * then checks overlapping bookings and maintenance blocks. MUST be called inside
 * a transaction. The DB exclusion constraint is the final safety net.
 */
export async function lockAndAssertAvailable(
  tx: Tx,
  p: { vehicleId: string; pickupAt: Date; returnAt: Date; excludeBookingId?: string; ignoreVehicleStatus?: boolean },
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${p.vehicleId}))`;
  await expireStaleHolds(tx, p.vehicleId);

  const vehicle = await tx.vehicle.findFirst({ where: { id: p.vehicleId, deletedAt: null } });
  if (!vehicle) throw AppError.notFound('Vehicle not found');
  if (!p.ignoreVehicleStatus && (vehicle.status !== 'AVAILABLE' || !vehicle.isPublished))
    throw AppError.conflict('This vehicle is currently not available for booking', 'VEHICLE_UNAVAILABLE');

  const clash = await tx.booking.findFirst({
    where: {
      vehicleId: p.vehicleId,
      status: { in: ACTIVE_STATUSES },
      pickupAt: { lt: p.returnAt },
      returnAt: { gt: p.pickupAt },
      ...(p.excludeBookingId ? { id: { not: p.excludeBookingId } } : {}),
    },
    select: { id: true },
  });

  const block = await tx.vehicleAvailability.findFirst({
    where: { vehicleId: p.vehicleId, deletedAt: null, startAt: { lt: p.returnAt }, endAt: { gt: p.pickupAt } },
  });

  // If initially requested unit is booked or blocked, check if a sibling unit of the same model is free!
  if (clash || block) {
    if (vehicle.model) {
      const siblings = await tx.vehicle.findMany({
        where: {
          model: vehicle.model,
          deletedAt: null,
          status: 'AVAILABLE',
          isPublished: true,
          id: { not: p.vehicleId },
        },
      });

      for (const sib of siblings) {
        const sibClash = await tx.booking.findFirst({
          where: {
            vehicleId: sib.id,
            status: { in: ACTIVE_STATUSES },
            pickupAt: { lt: p.returnAt },
            returnAt: { gt: p.pickupAt },
            ...(p.excludeBookingId ? { id: { not: p.excludeBookingId } } : {}),
          },
          select: { id: true },
        });
        if (sibClash) continue;

        const sibBlock = await tx.vehicleAvailability.findFirst({
          where: { vehicleId: sib.id, deletedAt: null, startAt: { lt: p.returnAt }, endAt: { gt: p.pickupAt } },
          select: { id: true },
        });
        if (sibBlock) continue;

        // Found an available sibling unit in the fleet! Reassign vehicleId transparently
        p.vehicleId = sib.id;
        return sib;
      }
    }

    if (clash) {
      throw AppError.conflict('All units for this vehicle model are currently booked for the selected schedule.', 'VEHICLE_UNAVAILABLE');
    }
    if (block) {
      throw AppError.conflict(
        `All units for this vehicle model are unavailable (${block.type === 'MAINTENANCE' ? 'maintenance' : 'blocked'}) for the selected schedule.`,
        'VEHICLE_UNAVAILABLE',
      );
    }
  }

  return vehicle;
}

/** Non-locking availability check used for search & instant feedback in the UI. */
export async function isAvailable(vehicleId: string, pickupAt: Date, returnAt: Date, excludeBookingId?: string) {
  const now = new Date();
  const [clash, block] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ACTIVE_STATUSES },
        pickupAt: { lt: returnAt },
        returnAt: { gt: pickupAt },
        OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }],
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { id: true },
    }),
    prisma.vehicleAvailability.findFirst({
      where: { vehicleId, deletedAt: null, startAt: { lt: returnAt }, endAt: { gt: pickupAt } },
      select: { id: true },
    }),
  ]);
  return !clash && !block;
}

/** Busy periods for the public availability calendar (no personal data). */
export async function vehicleSchedule(vehicleId: string, from: Date, to: Date) {
  const now = new Date();
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        vehicleId,
        status: { in: ACTIVE_STATUSES },
        pickupAt: { lt: to },
        returnAt: { gt: from },
        OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }],
      },
      select: { id: true, pickupAt: true, returnAt: true, status: true },
      orderBy: { pickupAt: 'asc' },
    }),
    prisma.vehicleAvailability.findMany({
      where: { vehicleId, deletedAt: null, startAt: { lt: to }, endAt: { gt: from } },
      select: { id: true, startAt: true, endAt: true, type: true },
    }),
  ]);
  return [
    ...bookings.map((b) => ({ start: b.pickupAt, end: b.returnAt, state: calendarState(b.status) as CalendarState })),
    ...blocks.map((b) => ({ start: b.startAt, end: b.endAt, state: 'MAINTENANCE' as CalendarState })),
  ];
}

