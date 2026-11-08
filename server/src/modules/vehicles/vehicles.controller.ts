import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import { parse } from '../../middleware/error';
import { paginate, slugify } from '../../lib/utils';
import { startingRates } from '../../services/pricing.service';
import { isAvailable, vehicleSchedule } from '../../services/availability.service';
import { saveFile, deleteFile } from '../../services/storage.service';
import { getCached, setCached, invalidateCache } from '../../lib/cache';
import { createVehicleSchema, updateVehicleSchema, vehicleFilterSchema } from './vehicles.schema';

export async function listVehicles(req: Request, res: Response) {
  const query = parse(vehicleFilterSchema, req.query);
  const { skip, take, page, pageSize } = paginate(query);

  // If simple listing without real-time date filters, check memory cache
  const isCacheable = !query.availableFrom && !query.availableTo;
  const cacheKey = isCacheable ? `vehicles:list:${JSON.stringify(query)}` : null;
  if (cacheKey) {
    const cached = getCached<any>(cacheKey);
    if (cached) return res.json(cached);
  }

  const where: any = {
    deletedAt: null,
    isPublished: true,
  };

  if (query.category) where.category = query.category;
  if (query.transmission) where.transmission = query.transmission;
  if (query.rentalType === 'SELF_DRIVE') where.allowSelfDrive = true;
  if (query.rentalType === 'WITH_DRIVER') where.allowWithDriver = true;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { make: { contains: query.search, mode: 'insensitive' } },
      { model: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, vehicles] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
      },
    }),
  ]);

  const vehicleIds = vehicles.map((v) => v.id);
  const ratesMap = await startingRates(vehicleIds);

  let filteredVehicles = vehicles;
  if (query.availableFrom && query.availableTo) {
    const from = new Date(query.availableFrom);
    const to = new Date(query.availableTo);
    const availabilityChecks = await Promise.all(
      vehicles.map(async (v) => {
        const available = await isAvailable(v.id, from, to);
        return { v, available };
      })
    );
    filteredVehicles = availabilityChecks.filter((c) => c.available).map((c) => c.v);
  }

  const allFleet = await prisma.vehicle.findMany({
    where: { deletedAt: null },
    select: { id: true, model: true, status: true },
  });

  const result = filteredVehicles.map((v) => {
    const siblings = v.model ? allFleet.filter((f) => f.model === v.model) : [];
    const fleetCount = siblings.length || 1;
    const availableFleetCount = siblings.filter((s) => s.status === 'AVAILABLE').length || (v.status === 'AVAILABLE' ? 1 : 0);

    return {
      ...v,
      fleetCount,
      availableFleetCount,
      startingRates: ratesMap[v.id] || { SELF_DRIVE: null, WITH_DRIVER: null, SELF_DRIVE_12: null, WITH_DRIVER_12: null },
    };
  });

  const payload = {
    data: result,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  if (cacheKey) {
    setCached(cacheKey, payload, 300); // 5 min TTL
  }

  res.json(payload);
}

export async function getVehicleBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const cacheKey = `vehicle:slug:${slug}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return res.json(cached);

  const vehicle = await prisma.vehicle.findFirst({
    where: { slug, deletedAt: null },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      rates: {
        where: { isPublished: true, amount: { not: null } },
        include: { destination: true },
        orderBy: [{ destination: { sortOrder: 'asc' } }, { duration: 'asc' }],
      },
    },
  });

  if (!vehicle) throw AppError.notFound('Vehicle not found');

  const [startingRate] = Object.values(await startingRates([vehicle.id]));

  // Pre-fetch calendar events for instant single-trip load
  let calendarEvents: any[] = [];
  try {
    const startDate = new Date(Date.now() - 30 * 86_400_000);
    const endDate = new Date(Date.now() + 90 * 86_400_000);
    const siblingVehicles = vehicle.model
      ? await prisma.vehicle.findMany({ where: { model: vehicle.model, deletedAt: null } })
      : [vehicle];

    calendarEvents = (
      await Promise.all(
        siblingVehicles.map(async (v) => {
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
  } catch (err) {
    console.error('Failed to pre-fetch calendar events for vehicle:', err);
  }

  const payload = {
    vehicle: {
      ...vehicle,
      startingRates: startingRate,
      calendarEvents,
    },
  };

  setCached(cacheKey, payload, 180); // 3 min TTL
  res.json(payload);
}

export async function adminListVehicles(req: Request, res: Response) {
  const vehicles = await prisma.vehicle.findMany({
    where: { deletedAt: null },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      _count: {
        select: { bookings: true, rates: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const ratesMap = await startingRates(vehicles.map((v) => v.id));

  res.json({
    vehicles: vehicles.map((v) => ({
      ...v,
      startingRates: ratesMap[v.id],
    })),
  });
}

export async function createVehicle(req: Request, res: Response) {
  const data = parse(createVehicleSchema, req.body);
  let baseSlug = slugify(data.name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.vehicle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...data,
      slug,
    },
    include: { images: true },
  });

  invalidateCache();
  res.status(201).json({ vehicle });
}

export async function updateVehicle(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = parse(updateVehicleSchema, req.body);

  const existing = await prisma.vehicle.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw AppError.notFound('Vehicle not found');

  const updated = await prisma.vehicle.update({
    where: { id },
    data,
    include: { images: true },
  });

  invalidateCache();
  res.json({ vehicle: updated });
}

export async function deleteVehicle(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.vehicle.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw AppError.notFound('Vehicle not found');

  await prisma.vehicle.update({
    where: { id },
    data: { deletedAt: new Date(), isPublished: false },
  });

  invalidateCache();
  res.json({ ok: true, message: 'Vehicle deleted' });
}

export async function uploadVehiclePhoto(req: Request, res: Response) {
  const id = String(req.params.id);
  const file = req.file;
  if (!file) throw AppError.badRequest('No image file uploaded');

  const vehicle = await prisma.vehicle.findFirst({ where: { id, deletedAt: null } });
  if (!vehicle) throw AppError.notFound('Vehicle not found');

  const stored = await saveFile(file, { folder: `vehicles/${id}`, visibility: 'public' });
  const hasPrimary = await prisma.vehicleImage.findFirst({ where: { vehicleId: id, isPrimary: true } });

  const image = await prisma.vehicleImage.create({
    data: {
      vehicleId: id,
      url: stored.url || '',
      storageKey: stored.key,
      isPrimary: !hasPrimary,
    },
  });

  invalidateCache();
  res.status(201).json({ image });
}

export async function deleteVehiclePhoto(req: Request, res: Response) {
  const id = String(req.params.id);
  const imageId = String(req.params.imageId);
  const img = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId: id } });
  if (!img) throw AppError.notFound('Image not found');

  if (img.storageKey) {
    await deleteFile('local', img.storageKey, 'public');
  }

  await prisma.vehicleImage.delete({ where: { id: imageId } });

  if (img.isPrimary) {
    const next = await prisma.vehicleImage.findFirst({ where: { vehicleId: id }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.vehicleImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  invalidateCache();
  res.json({ ok: true });
}

export async function setPrimaryPhoto(req: Request, res: Response) {
  const id = String(req.params.id);
  const imageId = String(req.params.imageId);
  await prisma.$transaction(async (tx) => {
    await tx.vehicleImage.updateMany({ where: { vehicleId: id }, data: { isPrimary: false } });
    await tx.vehicleImage.update({ where: { id: imageId, vehicleId: id }, data: { isPrimary: true } });
  });

  invalidateCache();
  res.json({ ok: true });
}
