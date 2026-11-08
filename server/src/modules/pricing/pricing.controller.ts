import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { parse } from '../../middleware/error';
import { slugify } from '../../lib/utils';
import { audit } from '../../services/audit.service';
import { calculateQuote, startingRates } from '../../services/pricing.service';
import {
  additionalFeeSchema,
  destinationSchema,
  promotionSchema,
  quoteQuerySchema,
  updateRateMatrixSchema,
} from './pricing.schema';

export async function getQuote(req: Request, res: Response) {
  const query = parse(quoteQuerySchema, req.query);
  const quote = await calculateQuote({
    vehicleId: query.vehicleId,
    destinationId: query.destinationId,
    rentalType: query.rentalType,
    pickupAt: new Date(query.pickupAt),
    returnAt: new Date(query.returnAt),
    pickupMethod: query.pickupMethod,
    deliveryZoneId: query.deliveryZoneId,
    surchargeIds: query.surchargeIds,
    promoCode: query.promoCode,
    unliMileage: query.unliMileage,
  });

  res.json({ quote });
}

export async function getPricelist(_req: Request, res: Response) {
  const [destinations, vehicles, rates, additionalFees] = await Promise.all([
    prisma.destination.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.vehicle.findMany({
      where: { deletedAt: null, isPublished: true },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.vehicleRate.findMany({
      where: {
        isPublished: true,
        amount: { not: null },
      },
      include: {
        destination: { select: { id: true, name: true, slug: true, sortOrder: true } },
      },
    }),
    prisma.additionalFee.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    }),
  ]);

  const vehicleIds = vehicles.map((v) => v.id);
  const ratesMap = await startingRates(vehicleIds);

  const formattedVehicles = vehicles.map((v) => ({
    ...v,
    startingRates: ratesMap[v.id] || { SELF_DRIVE: null, WITH_DRIVER: null, SELF_DRIVE_12: null, WITH_DRIVER_12: null },
  }));

  res.json({
    destinations,
    vehicles: formattedVehicles,
    rates,
    additionalFees,
    policies: {
      reservationFee: 1000,
      reservationFeeNote: 'Locks dates on calendar, strictly non-refundable upon cancellation (rescheduling permitted), and doubles as refundable security deposit upon vehicle return.',
      cleanlinessPolicy: 'Return unit clean for 100% security deposit refund. If returned unwashed, standard carwash fee is deducted: ₱300 (Sedan) / ₱400 (SUV/MPV/Van).',
      overtimePerHour: {
        SEDAN: 150,
        SUV_MPV: 200,
        VAN: 250,
      },
      fuelPolicy: 'Same-to-Same: Vehicle is released with a specific fuel level (usually full tank) and must be returned with the same fuel level.',
      driverTerms: 'With-Driver rentals include professional chauffeur for up to 12h or 24h duty. Chauffeur meals and out-of-town overnight lodging (if applicable) are provided or reimbursed by renter.',
    },
  });
}

export async function listDestinations(_req: Request, res: Response) {
  const destinations = await prisma.destination.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ destinations });
}

export async function adminListDestinations(_req: Request, res: Response) {
  const destinations = await prisma.destination.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ destinations });
}

export async function createDestination(req: Request, res: Response) {
  const data = parse(destinationSchema, req.body);
  const slug = slugify(data.name);

  const existing = await prisma.destination.findUnique({ where: { slug } });
  if (existing) throw AppError.conflict('Destination already exists');

  const destination = await prisma.destination.create({
    data: { ...data, slug },
  });

  await audit({ actorId: req.user!.id, action: 'destination.create', entityType: 'destination', entityId: destination.id, req });
  res.status(201).json({ destination });
}

export async function updateDestination(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(destinationSchema.partial(), req.body);

  const updated = await prisma.destination.update({
    where: { id },
    data,
  });

  await audit({ actorId: req.user!.id, action: 'destination.update', entityType: 'destination', entityId: id, req });
  res.json({ destination: updated });
}

export async function getVehicleRateMatrix(req: Request, res: Response) {
  const vehicleId = String(req.params.vehicleId);
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw AppError.notFound('Vehicle not found');

  const [destinations, rates] = await Promise.all([
    prisma.destination.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
    prisma.vehicleRate.findMany({ where: { vehicleId } }),
  ]);

  res.json({ vehicle, destinations, rates });
}

export async function updateVehicleRateMatrix(req: Request, res: Response) {
  const vehicleId = String(req.params.vehicleId);
  const data = parse(updateRateMatrixSchema, req.body);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw AppError.notFound('Vehicle not found');

  const results = await prisma.$transaction(async (tx) => {
    const updatedRates = [];
    for (const r of data.rates) {
      const rate = await tx.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId,
            destinationId: r.destinationId,
            rentalType: r.rentalType,
            duration: r.duration,
          },
        },
        create: {
          vehicleId,
          destinationId: r.destinationId,
          rentalType: r.rentalType,
          duration: r.duration,
          pricingUnit: r.pricingUnit,
          amount: r.amount !== null && r.amount !== undefined ? r.amount : null,
          isPublished: r.isPublished,
          notes: r.notes,
        },
        update: {
          amount: r.amount !== null && r.amount !== undefined ? r.amount : null,
          isPublished: r.isPublished,
          pricingUnit: r.pricingUnit,
          notes: r.notes,
        },
      });
      updatedRates.push(rate);
    }
    return updatedRates;
  });

  await audit({
    actorId: req.user!.id,
    action: 'rates.update_matrix',
    entityType: 'vehicle_rates',
    entityId: vehicleId,
    details: { count: results.length },
    req,
  });

  res.json({ ok: true, rates: results });
}

export async function listAdditionalFees(_req: Request, res: Response) {
  const fees = await prisma.additionalFee.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json({ fees });
}

export async function adminListAdditionalFees(_req: Request, res: Response) {
  const fees = await prisma.additionalFee.findMany({
    where: { deletedAt: null },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json({ fees });
}

export async function createAdditionalFee(req: Request, res: Response) {
  const data = parse(additionalFeeSchema, req.body);
  const baseCode = data.code || slugify(data.name).toUpperCase().replace(/-/g, '_');
  const code = data.code || `${baseCode}_${Date.now().toString().slice(-4)}`;
  const fee = await prisma.additionalFee.create({ data: { ...data, code } });
  await audit({ actorId: req.user!.id, action: 'fee.create', entityType: 'additional_fee', entityId: fee.id, req });
  res.status(201).json({ fee });
}

export async function updateAdditionalFee(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(additionalFeeSchema.partial(), req.body);
  const fee = await prisma.additionalFee.update({ where: { id }, data });
  await audit({ actorId: req.user!.id, action: 'fee.update', entityType: 'additional_fee', entityId: fee.id, req });
  res.json({ fee });
}

export async function deleteAdditionalFee(req: Request, res: Response) {
  const id = String(req.params.id);
  const fee = await prisma.additionalFee.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await audit({ actorId: req.user!.id, action: 'fee.delete', entityType: 'additional_fee', entityId: fee.id, req });
  res.json({ ok: true, id, message: `Fee "${fee.name}" deleted` });
}

export async function listPromotions(_req: Request, res: Response) {
  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: 'desc' },
    include: { vehicle: { select: { id: true, name: true } } },
  });
  res.json({ promotions });
}

export async function createPromotion(req: Request, res: Response) {
  const data = parse(promotionSchema, req.body);
  const promo = await prisma.promotion.create({
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });
  await audit({ actorId: req.user!.id, action: 'promotion.create', entityType: 'promotion', entityId: promo.id, req });
  res.status(201).json({ promotion: promo });
}

export async function updatePromotion(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(promotionSchema.partial(), req.body);
  const promo = await prisma.promotion.update({
    where: { id },
    data: {
      ...data,
      startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : undefined,
      endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : undefined,
    },
  });
  await audit({ actorId: req.user!.id, action: 'promotion.update', entityType: 'promotion', entityId: promo.id, req });
  res.json({ promotion: promo });
}

