import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { calendarState, vehicleSchedule } from '../../services/availability.service';
import { rescheduleBooking } from '../../services/booking.service';
import { audit } from '../../services/audit.service';
import { notifyBooking } from '../../services/notification.service';

export async function getVehiclePublicCalendar(req: Request, res: Response) {
  const vehicleId = String(req.params.vehicleId || 'all');
  const { from, to } = req.query;

  const startDate = from ? new Date(String(from)) : new Date(Date.now() - 30 * 86_400_000);
  const endDate = to ? new Date(String(to)) : new Date(Date.now() + 90 * 86_400_000);

  let targetVehicles: any[] = [];
  if (vehicleId === 'all') {
    targetVehicles = await prisma.vehicle.findMany({
      where: { deletedAt: null, isPublished: true },
      select: { id: true, name: true, model: true, plateNumber: true, category: true, status: true },
    });
  } else {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    targetVehicles = vehicle?.model
      ? await prisma.vehicle.findMany({ where: { model: vehicle.model, deletedAt: null } })
      : vehicle
      ? [vehicle]
      : [];
  }

  const allEvents = (
    await Promise.all(
      targetVehicles.map(async (v) => {
        const evs = await vehicleSchedule(v.id, startDate, endDate);
        return evs.map((e) => ({
          ...e,
          resourceId: v.id,
          extendedProps: {
            vehicleName: v.name,
            model: v.model,
            plateNumber: v.plateNumber,
          },
        }));
      })
    )
  ).flat();

  res.json({ events: allEvents, vehicles: targetVehicles });
}

export async function getAdminCalendarEvents(req: Request, res: Response) {
  const { vehicleId, status, from, to } = req.query;

  const startDate = from ? new Date(String(from)) : new Date(Date.now() - 30 * 86_400_000);
  const endDate = to ? new Date(String(to)) : new Date(Date.now() + 90 * 86_400_000);

  const bookingWhere: any = {
    pickupAt: { lt: endDate },
    returnAt: { gt: startDate },
  };

  if (vehicleId) bookingWhere.vehicleId = String(vehicleId);
  if (status) {
    bookingWhere.status = String(status);
  } else {
    bookingWhere.status = { notIn: ['CANCELLED', 'REJECTED', 'EXPIRED'] };
  }

  const [bookings, blocks, vehicles] = await Promise.all([
    prisma.booking.findMany({
      where: bookingWhere,
      include: {
        vehicle: { select: { id: true, name: true, plateNumber: true, category: true, model: true } },
        destination: { select: { name: true } },
      },
      orderBy: { pickupAt: 'asc' },
    }),
    prisma.vehicleAvailability.findMany({
      where: {
        deletedAt: null,
        startAt: { lt: endDate },
        endAt: { gt: startDate },
        ...(vehicleId ? { vehicleId: String(vehicleId) } : {}),
      },
      include: {
        vehicle: { select: { id: true, name: true, plateNumber: true } },
      },
    }),
    prisma.vehicle.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, plateNumber: true, category: true, model: true },
    }),
  ]);

  const bookingEvents = bookings.map((b) => {
    const state = calendarState(b.status);
    let color = '#eab308'; // Yellow = Pending
    if (b.status === 'CONFIRMED') color = '#ef4444'; // Red = Reserved/Confirmed
    else if (b.status === 'ONGOING') color = '#2563eb'; // Blue = Ongoing Rental
    else if (b.status === 'COMPLETED') color = '#10b981'; // Green = Returned/Completed

    return {
      id: `booking-${b.id}`,
      bookingId: b.id,
      title: `${b.vehicle.name} - ${b.customerName} (${b.reference})`,
      start: b.pickupAt,
      end: b.returnAt,
      resourceId: b.vehicleId,
      backgroundColor: color,
      borderColor: color,
      textColor: '#ffffff',
      extendedProps: {
        type: 'BOOKING',
        status: b.status,
        state,
        reference: b.reference,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        destination: b.destination?.name || 'Local Destination',
        rentalType: b.rentalType,
        totalAmount: b.totalAmount,
        vehicleName: b.vehicle.name,
        model: b.vehicle.model,
        plateNumber: b.vehicle.plateNumber,
      },
    };
  });

  const blockEvents = blocks.map((bl) => ({
    id: `block-${bl.id}`,
    blockId: bl.id,
    title: `[${bl.type}] ${bl.vehicle.name} - ${bl.reason || 'Unavailable'}`,
    start: bl.startAt,
    end: bl.endAt,
    resourceId: bl.vehicleId,
    backgroundColor: '#6b7280', // Gray = Maintenance
    borderColor: '#6b7280',
    textColor: '#ffffff',
    extendedProps: {
      type: 'BLOCK',
      blockType: bl.type,
      reason: bl.reason,
      vehicleName: bl.vehicle.name,
    },
  }));

  res.json({
    events: [...bookingEvents, ...blockEvents],
    resources: vehicles.map((v) => ({
      id: v.id,
      title: `${v.name} ${v.plateNumber ? `(${v.plateNumber})` : ''}`,
      category: v.category,
    })),
  });
}

export async function createMaintenanceBlock(req: Request, res: Response) {
  const { vehicleId, type = 'MAINTENANCE', startAt, endAt, reason } = req.body;
  if (!vehicleId || !startAt || !endAt) {
    throw AppError.badRequest('vehicleId, startAt, and endAt are required');
  }

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (!(end > start)) throw AppError.badRequest('endAt must be after startAt');

  const clash = await prisma.booking.findFirst({
    where: {
      vehicleId,
      status: { in: ['CONFIRMED', 'ONGOING', 'REQUIREMENTS_REVIEW', 'PAYMENT_VERIFICATION'] },
      pickupAt: { lt: end },
      returnAt: { gt: start },
    },
  });
  if (clash) {
    throw AppError.conflict('Cannot block vehicle: active booking exists during this time period', 'CONFLICT');
  }

  const block = await prisma.vehicleAvailability.create({
    data: {
      vehicleId,
      type: type === 'BLOCKED' ? 'BLOCKED' : 'MAINTENANCE',
      startAt: start,
      endAt: end,
      reason,
      createdById: req.user!.id,
    },
    include: { vehicle: true },
  });

  await audit({ actorId: req.user!.id, action: 'availability.block_created', entityType: 'vehicle_availability', entityId: block.id, req });
  res.status(201).json({ block });
}

export async function deleteMaintenanceBlock(req: Request, res: Response) {
  const id = String(req.params.id);
  const block = await prisma.vehicleAvailability.findUnique({ where: { id } });
  if (!block) throw AppError.notFound('Block not found');

  await prisma.vehicleAvailability.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await audit({ actorId: req.user!.id, action: 'availability.block_deleted', entityType: 'vehicle_availability', entityId: id, req });
  res.json({ ok: true });
}

export async function adminDragReschedule(req: Request, res: Response) {
  const { bookingId, pickupAt, returnAt } = req.body;
  if (!bookingId || !pickupAt || !returnAt) {
    throw AppError.badRequest('bookingId, pickupAt, and returnAt are required');
  }

  const result = await rescheduleBooking(req.user!.id, bookingId, new Date(pickupAt), new Date(returnAt), {
    reprice: false,
  });

  await audit({
    actorId: req.user!.id,
    action: 'calendar.drag_rescheduled',
    entityType: 'booking',
    entityId: bookingId,
    before: result.before,
    after: result.after,
    req,
  });

  await notifyBooking('BOOKING_RESCHEDULED', bookingId);
  res.json({ booking: result.after });
}

