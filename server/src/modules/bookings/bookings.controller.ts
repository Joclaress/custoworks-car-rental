import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { parse } from '../../middleware/error';
import { paginate } from '../../lib/utils';
import { audit } from '../../services/audit.service';
import { notifyAdmin, notifyBooking } from '../../services/notification.service';
import { streamRentalAgreement } from '../../services/pdf.service';
import { hashPassword } from '../auth/auth.service';
import {
  bookingFinancials,
  confirmationBlockers,
  createDraft,
  rescheduleBooking,
  submitDraft,
  transition,
  updateDraft,
} from '../../services/booking.service';
import {
  adminRescheduleSchema,
  bookingFilterSchema,
  bookingNoteSchema,
  cancelBookingSchema,
  draftBookingSchema,
  handleRequestSchema,
  requestActionSchema,
  updateDraftSchema,
} from './bookings.schema';

export async function createDraftBooking(req: Request, res: Response) {
  const data = parse(draftBookingSchema, req.body);
  let userId = req.user?.id;

  if (!userId) {
    const rawEmail = data.customer?.customerEmail?.toLowerCase().trim();
    const guestEmail = rawEmail || `guest-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@custoworks.ph`;
    let guestUser = await prisma.user.findFirst({ where: { email: guestEmail } });
    if (!guestUser) {
      const passwordHash = await hashPassword(crypto.randomUUID());
      guestUser = await prisma.user.create({
        data: {
          email: guestEmail,
          fullName: data.customer?.customerName?.trim() || 'Guest Customer',
          phone: data.customer?.customerPhone?.trim() || null,
          role: 'CUSTOMER',
          passwordHash,
        },
      });
    }
    userId = guestUser.id;
  }

  const booking = await createDraft(userId, {
    ...data,
    pickupAt: new Date(data.pickupAt),
    returnAt: new Date(data.returnAt),
  });

  const fullBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      vehicle: { include: { images: { orderBy: { isPrimary: 'desc' } } } },
      destination: true,
      fees: true,
      requirements: {
        include: {
          requirementType: true,
          documents: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });

  await audit({ actorId: userId, action: 'booking.draft_created', entityType: 'booking', entityId: booking.id, req });
  res.status(201).json({ booking: fullBooking || booking });
}

export async function updateDraftBooking(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(updateDraftSchema, req.body);
  const booking = await updateDraft(req.user?.id ?? null, id, {
    ...data,
    pickupAt: data.pickupAt ? new Date(data.pickupAt) : undefined,
    returnAt: data.returnAt ? new Date(data.returnAt) : undefined,
  });

  const fullBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      vehicle: { include: { images: { orderBy: { isPrimary: 'desc' } } } },
      destination: true,
      fees: true,
      requirements: {
        include: {
          requirementType: true,
          documents: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });

  res.json({ booking: fullBooking || booking });
}

export async function submitBooking(req: Request, res: Response) {
  const id = String(req.params.id);
  const booking = await submitDraft(req.user?.id ?? null, id, req.ip);

  const actorId = req.user?.id ?? booking.customerId;
  await audit({ actorId, action: 'booking.submitted', entityType: 'booking', entityId: booking.id, req });
  await notifyBooking('BOOKING_SUBMITTED', booking.id);
  await notifyAdmin(`New Booking Submitted: ${booking.reference}`, `Customer ${booking.customerName} submitted booking ${booking.reference}.`);

  res.json({ booking });
}

export async function getBookingById(req: Request, res: Response) {
  const id = String(req.params.id);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw AppError.notFound('Booking not found');
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      vehicle: {
        include: { images: { orderBy: { isPrimary: 'desc' } } },
      },
      destination: true,
      fees: true,
      requirements: {
        include: {
          requirementType: true,
          documents: { orderBy: { createdAt: 'desc' } },
        },
      },
      payments: {
        include: { paymentMethod: true },
        orderBy: { createdAt: 'desc' },
      },
      agreement: true,
      notes: {
        include: { author: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      requests: { orderBy: { createdAt: 'desc' } },
      statusHistory: {
        include: { actor: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!booking) throw AppError.notFound('Booking not found');

  if (req.user && req.user.role === 'CUSTOMER' && booking.customerId !== req.user.id) {
    throw AppError.notFound('Booking not found');
  }

  const financials = await bookingFinancials(prisma, booking);
  const blockers = await confirmationBlockers(prisma, booking);

  res.json({
    booking,
    financials,
    confirmationBlockers: blockers,
  });
}

export async function trackBooking(req: Request, res: Response) {
  const ref = String(req.params.reference).toUpperCase().trim();
  const booking = await prisma.booking.findUnique({
    where: { reference: ref },
    include: {
      vehicle: {
        include: { images: { orderBy: { isPrimary: 'desc' } } },
      },
      destination: true,
      fees: true,
      requirements: {
        include: {
          requirementType: true,
          documents: { orderBy: { createdAt: 'desc' } },
        },
      },
      payments: {
        include: { paymentMethod: true },
        orderBy: { createdAt: 'desc' },
      },
      agreement: true,
      statusHistory: {
        include: { actor: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      requests: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!booking) {
    throw AppError.notFound('No booking found with tracking number ' + ref);
  }

  const financials = await bookingFinancials(prisma, booking);

  res.json({
    booking,
    financials,
  });
}

export async function downloadTrackAgreement(req: Request, res: Response) {
  const ref = String(req.params.reference).toUpperCase().trim();
  const booking = await prisma.booking.findUnique({ where: { reference: ref } });
  if (!booking) throw AppError.notFound('Booking not found');
  await streamRentalAgreement(res, booking.id);
}

export async function createTrackCustomerRequest(req: Request, res: Response) {
  const ref = String(req.params.reference).toUpperCase().trim();
  const booking = await prisma.booking.findUnique({ where: { reference: ref } });
  if (!booking) throw AppError.notFound('Booking not found');

  const data = parse(requestActionSchema, req.body);
  const request = await prisma.bookingRequest.create({
    data: {
      bookingId: booking.id,
      requestedById: booking.customerId,
      type: data.type,
      requestedPickupAt: data.requestedPickupAt ? new Date(data.requestedPickupAt) : null,
      requestedReturnAt: data.requestedReturnAt ? new Date(data.requestedReturnAt) : null,
      reason: data.reason,
    },
  });

  await notifyAdmin(
    `Customer ${data.type} Request for ${booking.reference}`,
    `Customer ${booking.customerName} requested ${data.type.toLowerCase()}: ${data.reason}`
  );

  res.status(201).json({ request });
}

export async function listMyBookings(req: Request, res: Response) {
  const query = parse(bookingFilterSchema, req.query);
  const { skip, take, page, pageSize } = paginate(query);

  const where: any = { customerId: req.user!.id };
  if (query.status) where.status = query.status;

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          include: { images: { where: { isPrimary: true } } },
        },
        destination: true,
        payments: {
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            referenceNumber: true,
            receiptNumber: true,
            paidAt: true,
            createdAt: true,
            paymentMethod: { select: { id: true, name: true, code: true, kind: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
  ]);

  res.json({
    bookings,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function adminListBookings(req: Request, res: Response) {
  const query = parse(bookingFilterSchema, req.query);
  const { skip, take, page, pageSize } = paginate(query);

  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.search) {
    where.OR = [
      { reference: { contains: query.search, mode: 'insensitive' } },
      { customerName: { contains: query.search, mode: 'insensitive' } },
      { customerEmail: { contains: query.search, mode: 'insensitive' } },
      { customerPhone: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.from || query.to) {
    where.pickupAt = {};
    if (query.from) where.pickupAt.gte = new Date(query.from);
    if (query.to) where.pickupAt.lte = new Date(query.to);
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        destination: true,
        customer: { select: { id: true, email: true, fullName: true, phone: true } },
        payments: {
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            referenceNumber: true,
            receiptNumber: true,
            paidAt: true,
            createdAt: true,
            paymentMethod: { select: { id: true, name: true, code: true, kind: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { requirements: true, requests: true } },
      },
    }),
  ]);

  res.json({
    bookings,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function confirmBooking(req: Request, res: Response) {
  const id = String(req.params.id);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw AppError.notFound('Booking not found');

  const blockers = await confirmationBlockers(prisma, booking);
  if (blockers.length) {
    throw AppError.conflict(`Cannot confirm booking: ${blockers.join('; ')}`, 'CONFIRMATION_BLOCKED');
  }

  const updated = await prisma.$transaction(async (tx) => {
    return transition(tx, booking, 'CONFIRMED', req.user!.id, 'Booking confirmed by administrator', {
      confirmedAt: new Date(),
    });
  });

  const financials = await bookingFinancials(prisma, updated);
  await audit({ actorId: req.user!.id, action: 'booking.confirmed', entityType: 'booking', entityId: id, req });
  await notifyBooking('BOOKING_CONFIRMED', id, { balance: `₱${financials.balanceDue.toLocaleString()}` });

  res.json({ booking: updated });
}

export async function releaseVehicle(req: Request, res: Response) {
  const id = String(req.params.id);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.status !== 'CONFIRMED') throw AppError.conflict('Only confirmed bookings can be marked as ongoing/released');

  const updated = await prisma.$transaction(async (tx) => {
    return transition(tx, booking, 'ONGOING', req.user!.id, 'Vehicle released to customer', {
      releasedAt: new Date(),
    });
  });

  await audit({ actorId: req.user!.id, action: 'booking.released', entityType: 'booking', entityId: id, req });
  await notifyBooking('VEHICLE_RELEASED', id);
  res.json({ booking: updated });
}

export async function completeRental(req: Request, res: Response) {
  const id = String(req.params.id);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.status !== 'ONGOING') throw AppError.conflict('Only ongoing rentals can be marked as completed');

  const updated = await prisma.$transaction(async (tx) => {
    return transition(tx, booking, 'COMPLETED', req.user!.id, 'Vehicle returned by customer', {
      returnedAt: new Date(),
    });
  });

  await audit({ actorId: req.user!.id, action: 'booking.completed', entityType: 'booking', entityId: id, req });
  await notifyBooking('RENTAL_COMPLETED', id);
  res.json({ booking: updated });
}

export async function cancelBooking(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(cancelBookingSchema, req.body);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw AppError.notFound('Booking not found');

  const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'STAFF';
  if (!isStaff && booking.customerId !== req.user!.id) throw AppError.notFound('Booking not found');

  const updated = await prisma.$transaction(async (tx) => {
    return transition(tx, booking, 'CANCELLED', req.user!.id, data.reason, {
      cancelledAt: new Date(),
      cancelReason: data.reason,
    });
  });

  await audit({ actorId: req.user!.id, action: 'booking.cancelled', entityType: 'booking', entityId: id, details: data, req });
  await notifyBooking('BOOKING_CANCELLED', id, { reason: data.reason });
  res.json({ booking: updated });
}

export async function adminReschedule(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(adminRescheduleSchema, req.body);

  const result = await rescheduleBooking(req.user!.id, id, new Date(data.pickupAt), new Date(data.returnAt), {
    reprice: data.reprice,
  });

  await audit({
    actorId: req.user!.id,
    action: 'booking.rescheduled',
    entityType: 'booking',
    entityId: id,
    before: result.before,
    after: result.after,
    req,
  });

  await notifyBooking('BOOKING_RESCHEDULED', id);
  res.json({ booking: result.after });
}

export async function addBookingNote(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(bookingNoteSchema, req.body);

  const note = await prisma.bookingNote.create({
    data: {
      bookingId: id,
      authorId: req.user!.id,
      body: data.body,
    },
    include: { author: { select: { fullName: true, role: true } } },
  });

  res.status(201).json({ note });
}

export async function createCustomerRequest(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(requestActionSchema, req.body);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.customerId !== req.user!.id) throw AppError.notFound('Booking not found');

  const request = await prisma.bookingRequest.create({
    data: {
      bookingId: id,
      type: data.type,
      requestedById: req.user!.id,
      reason: data.reason,
      requestedPickupAt: data.requestedPickupAt ? new Date(data.requestedPickupAt) : null,
      requestedReturnAt: data.requestedReturnAt ? new Date(data.requestedReturnAt) : null,
    },
  });

  await notifyAdmin(
    `New ${data.type} Request for ${booking.reference}`,
    `Customer requested ${data.type.toLowerCase()}: ${data.reason}`
  );

  res.status(201).json({ request });
}

export async function handleCustomerRequest(req: Request, res: Response) {
  const requestId = String(req.params.requestId);
  const data = parse(handleRequestSchema, req.body);

  const request = await prisma.bookingRequest.findUnique({
    where: { id: requestId },
    include: { booking: true },
  });
  if (!request) throw AppError.notFound('Request not found');
  if (request.status !== 'PENDING') throw AppError.conflict('Request has already been processed');

  if (data.action === 'APPROVE') {
    if (request.type === 'RESCHEDULE') {
      if (!request.requestedPickupAt || !request.requestedReturnAt) {
        throw AppError.badRequest('Reschedule request is missing requested dates');
      }
      await rescheduleBooking(req.user!.id, request.bookingId, request.requestedPickupAt, request.requestedReturnAt);
    } else if (request.type === 'CANCELLATION') {
      await prisma.$transaction(async (tx) => {
        await transition(tx, request.booking, 'CANCELLED', req.user!.id, request.reason || 'Cancelled upon customer request', {
          cancelledAt: new Date(),
          cancelReason: request.reason,
        });
      });
      await notifyBooking('BOOKING_CANCELLED', request.bookingId, { reason: request.reason || undefined });
    }
  }

  const updatedRequest = await prisma.bookingRequest.update({
    where: { id: requestId },
    data: {
      status: data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      handledById: req.user!.id,
      handledAt: new Date(),
      adminResponse: data.adminResponse,
    },
  });

  if (data.action === 'REJECT' && request.type === 'RESCHEDULE') {
    await notifyBooking('RESCHEDULE_REJECTED', request.bookingId, { reason: data.adminResponse });
  }

  res.json({ request: updatedRequest });
}

export async function downloadAgreement(req: Request, res: Response) {
  const id = String(req.params.id);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw AppError.notFound('Booking not found');
  if (req.user!.role === 'CUSTOMER' && booking.customerId !== req.user!.id) throw AppError.notFound('Booking not found');

  await streamRentalAgreement(res, id);
}

export async function deleteBooking(req: Request, res: Response) {
  const id = String(req.params.id);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw AppError.notFound('Booking not found');

  await prisma.$transaction(async (tx) => {
    await tx.bookingStatusHistory.deleteMany({ where: { bookingId: id } });
    await tx.bookingNote.deleteMany({ where: { bookingId: id } });
    await tx.bookingFee.deleteMany({ where: { bookingId: id } });
    await tx.requirementReview.deleteMany({ where: { bookingRequirement: { bookingId: id } } });
    await tx.requirementDocument.deleteMany({ where: { bookingRequirement: { bookingId: id } } });
    await tx.bookingRequirement.deleteMany({ where: { bookingId: id } });
    await tx.rentalAgreement.deleteMany({ where: { bookingId: id } });
    await tx.payment.deleteMany({ where: { bookingId: id } });
    await tx.bookingRequest.deleteMany({ where: { bookingId: id } });
    await tx.booking.delete({ where: { id } });
  });

  await audit({
    actorId: req.user!.id,
    action: 'booking.delete',
    entityType: 'booking',
    entityId: id,
    details: { reference: booking.reference },
  });

  res.json({ success: true, message: `Booking ${booking.reference} deleted successfully` });
}

export async function getAdminDispatchSchedule(req: Request, res: Response) {
  const queryDate = req.query.date ? String(req.query.date) : new Date().toISOString().slice(0, 10);

  const dayStart = new Date(`${queryDate}T00:00:00+08:00`);
  const dayEnd = new Date(`${queryDate}T23:59:59.999+08:00`);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'REJECTED', 'EXPIRED'] },
      OR: [
        { pickupAt: { gte: dayStart, lte: dayEnd } },
        { returnAt: { gte: dayStart, lte: dayEnd } },
        {
          status: 'ONGOING',
          pickupAt: { lte: dayEnd },
          returnAt: { gte: dayStart },
        },
      ],
    },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          model: true,
          plateNumber: true,
          category: true,
          color: true,
          transmission: true,
          fuelType: true,
          seats: true,
          images: { select: { url: true, isPrimary: true }, take: 1 },
        },
      },
      destination: {
        select: { id: true, name: true, slug: true },
      },
      payments: {
        where: { status: 'APPROVED' },
        select: { id: true, amount: true, type: true, status: true, referenceNumber: true },
      },
    },
    orderBy: { pickupAt: 'asc' },
  });

  const releases: any[] = [];
  const returns: any[] = [];
  const ongoing: any[] = [];

  for (const b of bookings) {
    const financials = await bookingFinancials(prisma, b);
    const item = {
      ...b,
      financials,
    };

    const isPickup = b.pickupAt >= dayStart && b.pickupAt <= dayEnd;
    const isReturn = b.returnAt >= dayStart && b.returnAt <= dayEnd;

    if (isPickup) releases.push(item);
    if (isReturn) returns.push(item);
    if (b.status === 'ONGOING' && !isPickup && !isReturn) ongoing.push(item);
  }

  releases.sort((a, b) => new Date(a.pickupAt).getTime() - new Date(b.pickupAt).getTime());
  returns.sort((a, b) => new Date(a.returnAt).getTime() - new Date(b.returnAt).getTime());

  res.json({
    date: queryDate,
    releases,
    returns,
    ongoing,
    stats: {
      totalReleases: releases.length,
      totalReturns: returns.length,
      totalOngoing: ongoing.length,
    },
  });
}



