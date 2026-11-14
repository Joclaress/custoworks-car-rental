import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { parse } from '../../middleware/error';
import { authenticate, requireStaff } from '../../middleware/auth';
import {
  getAllSponsors,
  getPublicActiveSponsors,
  createSponsorApplication,
  recordSponsorPayment,
  toggleSponsorActive,
  updateSponsor,
  deleteSponsor,
  Sponsor,
} from '../../services/sponsor.service';

export const sponsorRoutes = Router();

const sponsorInquireSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  phone: z.string().min(7, 'Valid mobile/phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  category: z.enum(['HOTEL', 'FOOD', 'ADVENTURE', 'AUTOCARE', 'RETAIL', 'OTHER']).default('HOTEL'),
  categoryLabel: z.string().optional(),
  placementSlot: z.string().default('Local Partner Banner'),
  adHeadline: z.string().optional(),
  tagline: z.string().optional(),
  location: z.string().optional(),
  websiteUrl: z.string().optional(),
  proposedPerk: z.string().optional(),
  notes: z.string().optional(),
});

const recordPaymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than zero').default(3000),
  method: z.enum(['GCASH', 'MAYA', 'BANK_TRANSFER', 'CASH']),
  referenceNo: z.string().min(1, 'Reference or receipt number is required'),
  daysToAdd: z.coerce.number().min(1).default(30),
  notes: z.string().optional(),
});

// 1. PUBLIC: Get active sponsors for website banner display
sponsorRoutes.get('/', async (_req: Request, res: Response) => {
  try {
    const sponsors = await getPublicActiveSponsors();
    res.json({
      success: true,
      sponsors,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. PUBLIC: Apply for 14-day free trial banner placement
sponsorRoutes.post('/inquire', async (req: Request, res: Response) => {
  try {
    const data = parse(sponsorInquireSchema, req.body);
    const newSponsor = await createSponsorApplication({
      ...data,
      category: data.category as any,
    });

    res.status(201).json({
      success: true,
      message: '14-Day Free Trial started successfully! Our dispatch manager will review and contact you.',
      sponsor: newSponsor,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. ADMIN: Get all sponsors with trial expiration status and summary metrics
sponsorRoutes.get('/admin/all', authenticate, requireStaff, async (_req: Request, res: Response) => {
  try {
    const sponsors = await getAllSponsors();

    // Summary calculations
    const totalSponsors = sponsors.length;
    const activeTrials = sponsors.filter((s) => s.effectiveStatus === 'TRIAL_ACTIVE').length;
    const expiredTrials = sponsors.filter((s) => s.effectiveStatus === 'TRIAL_EXPIRED').length;
    const paidActive = sponsors.filter((s) => s.effectiveStatus === 'PAID_ACTIVE').length;
    const paidExpired = sponsors.filter((s) => s.effectiveStatus === 'PAID_EXPIRED').length;
    const actionRequiredCount = expiredTrials + paidExpired; // Sponsors whose trials or subscriptions are expired

    // Total revenue collected from all sponsors
    let totalRevenueCollected = 0;
    sponsors.forEach((s) => {
      if (Array.isArray(s.paymentHistory)) {
        s.paymentHistory.forEach((pm) => {
          totalRevenueCollected += Number(pm.amount) || 0;
        });
      }
    });

    res.json({
      success: true,
      sponsors,
      summary: {
        totalSponsors,
        activeTrials,
        expiredTrials,
        paidActive,
        paidExpired,
        actionRequiredCount,
        totalRevenueCollected,
        monthlySubscriptionRate: 3000,
        paymentInstructions: {
          gcash: {
            number: '0961 722 5326',
            name: 'Custoworks Car Rental / Charleine Oclares',
          },
          maya: {
            number: '0961 722 5326',
            name: 'Custoworks Car Rental',
          },
          bank: {
            bankName: 'BDO Unibank',
            accountName: 'Custoworks Car Rental',
            branch: 'Naga City',
          },
          cash: 'Custoworks Garage, Carnation St. CBD II Brgy. Triangulo (Beside SM City Naga)',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. ADMIN: Manually add a sponsor
sponsorRoutes.post('/admin/create', authenticate, requireStaff, async (req: Request, res: Response) => {
  try {
    const data = parse(sponsorInquireSchema, req.body);
    const newSponsor = await createSponsorApplication({
      ...data,
      category: data.category as any,
    });
    res.status(201).json({ success: true, sponsor: newSponsor });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. ADMIN: Record a ₱3,000 payment (GCash / Maya / Bank / Cash) and extend subscription
sponsorRoutes.post('/admin/:id/record-payment', authenticate, requireStaff, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const payment = parse(recordPaymentSchema, req.body);
    const updated = await recordSponsorPayment(id, {
      ...payment,
      recordedBy: req.user?.email || 'Admin',
    });

    res.json({
      success: true,
      message: `Payment of ₱${payment.amount.toLocaleString()} recorded successfully! Subscription extended by ${payment.daysToAdd} days.`,
      sponsor: updated,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. ADMIN: Toggle banner active on website
sponsorRoutes.patch('/admin/:id/toggle-active', authenticate, requireStaff, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { isActive } = req.body;
    const updated = await toggleSponsorActive(id, Boolean(isActive));
    res.json({ success: true, sponsor: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. ADMIN: Edit sponsor details
sponsorRoutes.patch('/admin/:id', authenticate, requireStaff, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await updateSponsor(id, req.body);
    res.json({ success: true, sponsor: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. ADMIN: Delete a sponsor
sponsorRoutes.delete('/admin/:id', authenticate, requireStaff, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const deleted = await deleteSponsor(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Sponsor not found' });
    }
    res.json({ success: true, message: 'Sponsor removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
