import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { parse } from '../../middleware/error';
import { authenticate, requireStaff } from '../../middleware/auth';
import { AppError } from '../../lib/errors';

export const partnerRoutes = Router();

const partnerApplySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid Philippine mobile number is required'),
  email: z.string().email('Valid email address is required'),
  city: z.string().default('Naga City'),
  vehicleMake: z.string().min(2, 'Vehicle make is required (e.g. Toyota, Mitsubishi)'),
  vehicleModel: z.string().min(1, 'Vehicle model is required (e.g. Vios, Mirage, Xpander)'),
  year: z.coerce.number().int().min(2012, 'Vehicle must be year 2012 or newer').max(2027),
  transmission: z.enum(['AT', 'MT']).default('AT'),
  category: z.enum(['SEDAN', 'SUV_MPV', 'VAN']).default('SEDAN'),
  color: z.string().optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  chassisVin: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  gpsBrandImei: z.string().optional().nullable(),
  insurancePolicy: z.string().optional().nullable(),
  rentalTypePreference: z.enum(['SELF_DRIVE', 'WITH_DRIVER']).default('SELF_DRIVE'),
  agreementAccepted: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED']),
  notes: z.string().optional().nullable(),
  partnerSharePercent: z.coerce.number().min(0).max(100).optional(),
  custoworksFeePercent: z.coerce.number().min(0).max(100).optional(),
});

// 1. Program details & 80/20 revenue breakdown info
partnerRoutes.get('/program-info', (_req: Request, res: Response) => {
  res.json({
    programName: 'Custoworks Tie-Up Fleet Partnership Program',
    location: 'Naga City, Camarines Sur & Bicol Region',
    revenueSplit: {
      partnerSharePercent: 80, // Car owner receives 80% of rental income
      custoworksCommissionPercent: 20, // Custoworks takes 20% platform management fee
      partnerShareLabel: '80% Owner Net Payout',
      custoworksCommissionLabel: '20% Custoworks Management Fee',
    },
    servicesIncludedIn20Percent: [
      'Comprehensive customer identity & LTMS portal driver license verification',
      '24/7 GPS real-time fleet tracking & geofencing security',
      'Full booking marketing, customer support & dispatch management',
      '₱1,000 reservation fee & security deposit inspection enforcement',
      'Legally binding Philippine rental contracts & digital sign-off',
      'Automated monthly or per-booking payout statements',
      '24/7 Bicol roadside assistance dispatch coordination',
    ],
    calculatorPresets: [
      {
        category: 'SEDAN',
        title: 'Compact Sedan (Vios / Mirage G4)',
        dailyRate: 2500,
        partnerSharePerDay: 2000,
        custoworksFeePerDay: 500,
        estimatedDaysPerMonth: 15,
        monthlyGross: 37500,
        partnerMonthlyNet: 30000,
        custoworksMonthlyFee: 7500,
      },
      {
        category: 'SUV_MPV',
        title: '7-Seater MPV / Compact SUV (Xpander / Innova)',
        dailyRate: 3200,
        partnerSharePerDay: 2560,
        custoworksFeePerDay: 640,
        estimatedDaysPerMonth: 15,
        monthlyGross: 48000,
        partnerMonthlyNet: 38400,
        custoworksMonthlyFee: 9600,
      },
      {
        category: 'VAN',
        title: '15-Passenger Van (NV350 Urvan / Hiace)',
        dailyRate: 4000,
        partnerSharePerDay: 3200,
        custoworksFeePerDay: 800,
        estimatedDaysPerMonth: 15,
        monthlyGross: 60000,
        partnerMonthlyNet: 48000,
        custoworksMonthlyFee: 12000,
      },
    ],
  });
});

// 2. Submit new tie-up partner application
partnerRoutes.post('/apply', async (req: Request, res: Response) => {
  const data = parse(partnerApplySchema, req.body);

  const application = await prisma.partnerApplication.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      city: data.city || 'Naga City',
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      year: data.year,
      transmission: data.transmission,
      category: data.category,
      color: data.color || null,
      plateNumber: data.plateNumber || null,
      chassisVin: data.chassisVin || null,
      engineNumber: data.engineNumber || null,
      gpsBrandImei: data.gpsBrandImei || null,
      insurancePolicy: data.insurancePolicy || null,
      rentalTypePreference: data.rentalTypePreference,
      partnerSharePercent: 80.0,
      custoworksFeePercent: 20.0,
      agreementAccepted: data.agreementAccepted,
      status: 'PENDING',
      notes: data.notes || null,
    },
  });

  res.status(201).json({
    ok: true,
    message: 'Partner application submitted successfully! Our dispatch specialist will contact you shortly.',
    application: {
      id: application.id,
      fullName: application.fullName,
      vehicle: `${application.year} ${application.vehicleMake} ${application.vehicleModel}`,
      partnerSharePercent: 80,
      custoworksFeePercent: 20,
      status: application.status,
      createdAt: application.createdAt,
    },
  });
});

// 3. Admin: list all applications
partnerRoutes.get('/applications', authenticate, requireStaff, async (_req: Request, res: Response) => {
  const applications = await prisma.partnerApplication.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    applications,
    summary: {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'PENDING').length,
      contacted: applications.filter((a) => a.status === 'CONTACTED').length,
      approved: applications.filter((a) => a.status === 'APPROVED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
    },
  });
});

// 4. Admin: update application status & terms
partnerRoutes.patch('/applications/:id/status', authenticate, requireStaff, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = parse(updateStatusSchema, req.body);

  const existing = await prisma.partnerApplication.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Partner application not found');

  const updated = await prisma.partnerApplication.update({
    where: { id },
    data: {
      status: data.status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      partnerSharePercent: data.partnerSharePercent !== undefined ? data.partnerSharePercent : existing.partnerSharePercent,
      custoworksFeePercent: data.custoworksFeePercent !== undefined ? data.custoworksFeePercent : existing.custoworksFeePercent,
    },
  });

  res.json({
    ok: true,
    application: updated,
  });
});
