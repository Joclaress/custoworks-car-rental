import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/prisma';

export interface SponsorPaymentRecord {
  id: string;
  amount: number;
  paidAt: string;
  method: 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CASH';
  referenceNo: string;
  daysAdded: number;
  recordedBy?: string;
  notes?: string;
}

export type SponsorStatus =
  | 'TRIAL_ACTIVE'
  | 'TRIAL_EXPIRED'
  | 'PAID_ACTIVE'
  | 'PAID_EXPIRED'
  | 'PAUSED'
  | 'CANCELLED';

export interface Sponsor {
  id: string;
  businessName: string;
  category: 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'AUTOCARE' | 'RETAIL' | 'OTHER';
  categoryLabel: string;
  contactPerson: string;
  phone: string;
  email?: string | null;
  placementSlot: string; // e.g. "Top Header Banner", "Carwash & Detailing Slot", "Hotel Slot"
  adHeadline?: string | null;
  tagline?: string | null;
  location: string;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  proposedPerk?: string | null;
  monthlyFee: number; // default 3000
  status: SponsorStatus;
  trialStartsAt: string; // ISO date
  trialEndsAt: string; // ISO date (trialStartsAt + 14 days)
  paidUntil?: string | null; // ISO date
  isActiveOnWebsite: boolean;
  paymentHistory: SponsorPaymentRecord[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields (included in responses)
  effectiveStatus?: SponsorStatus;
  daysRemaining?: number;
  daysOverdue?: number;
  isExpired?: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SPONSORS_FILE = path.join(DATA_DIR, 'sponsors.json');
const SETTING_KEY = 'sponsors_data';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Seed default official sponsor if empty
const DEFAULT_INITIAL_SPONSORS: Sponsor[] = [
  {
    id: 'sponsor-custoworks-carwash',
    businessName: 'Custoworks Carwash and Detailing',
    category: 'AUTOCARE',
    categoryLabel: 'Carwash & Detailing',
    contactPerson: 'Charleine Oclares / Garage Dispatch',
    phone: '0961 722 5326',
    email: 'custoworks1@gmail.com',
    placementSlot: 'Top Official Sponsor Banner & Auto Care Slot',
    adHeadline: 'Custoworks Carwash and Detailing | Naga City',
    tagline: 'Snow Foam Wash, Deep Interior Sanitization & Engine Bay Detailing',
    location: 'Carnation St. CBD II Brgy. Triangulo (Beside SM City), Naga City',
    imageUrl: '/images/carwash.jpg',
    websiteUrl: 'https://www.facebook.com/profile.php?id=61586727264046',
    proposedPerk: 'Priority Fast Lane Wash & Free Tire Dressing for Renters & Drivers',
    monthlyFee: 3000,
    status: 'PAID_ACTIVE',
    trialStartsAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    trialEndsAt: new Date(Date.now() - 16 * 86400000).toISOString(),
    paidUntil: new Date(Date.now() + 335 * 86400000).toISOString(), // 1 Year Official Partner
    isActiveOnWebsite: true,
    paymentHistory: [
      {
        id: 'pm-carwash-initial',
        amount: 36000,
        paidAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        method: 'CASH',
        referenceNo: 'OFFICIAL-PARTNER-2026',
        daysAdded: 365,
        recordedBy: 'Admin',
        notes: 'Official Flagship Carwash & Auto Detailing Partner of Custoworks Car Rental',
      },
    ],
    notes: 'Official Custoworks Sister Garage & Detailing Hub beside SM City Naga',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Computes live status and countdown metrics for a sponsor
 */
export function computeSponsorMetrics(sponsor: Sponsor): Sponsor {
  const now = Date.now();
  const trialEnd = new Date(sponsor.trialEndsAt).getTime();
  const paidUntil = sponsor.paidUntil ? new Date(sponsor.paidUntil).getTime() : null;

  let effectiveStatus: SponsorStatus = sponsor.status;
  let daysRemaining = 0;
  let daysOverdue = 0;
  let isExpired = false;

  if (sponsor.status === 'PAUSED' || sponsor.status === 'CANCELLED') {
    effectiveStatus = sponsor.status;
  } else if (paidUntil && paidUntil > now) {
    // Paid active subscription
    effectiveStatus = 'PAID_ACTIVE';
    daysRemaining = Math.max(0, Math.ceil((paidUntil - now) / 86400000));
    isExpired = false;
  } else if (paidUntil && paidUntil <= now) {
    // Paid subscription has lapsed
    effectiveStatus = 'PAID_EXPIRED';
    daysOverdue = Math.max(1, Math.floor((now - paidUntil) / 86400000));
    isExpired = true;
  } else if (trialEnd <= now) {
    // 14-day trial has ended without payment
    effectiveStatus = 'TRIAL_EXPIRED';
    daysOverdue = Math.max(1, Math.floor((now - trialEnd) / 86400000));
    isExpired = true;
  } else {
    // In 14-day free trial
    effectiveStatus = 'TRIAL_ACTIVE';
    daysRemaining = Math.max(1, Math.ceil((trialEnd - now) / 86400000));
    isExpired = false;
  }

  return {
    ...sponsor,
    effectiveStatus,
    daysRemaining,
    daysOverdue,
    isExpired,
  };
}

/**
 * Loads sponsors from JSON file, falling back to database setting table if available
 */
export async function getAllSponsors(): Promise<Sponsor[]> {
  ensureDataDir();

  // Try reading from file first
  let list: Sponsor[] = [];
  if (fs.existsSync(SPONSORS_FILE)) {
    try {
      const raw = fs.readFileSync(SPONSORS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse sponsors.json, will check DB:', e);
    }
  }

  // If file empty or missing, try loading from database setting
  if (list.length === 0) {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: SETTING_KEY },
      });
      if (setting && Array.isArray(setting.value) && (setting.value as any).length > 0) {
        list = setting.value as unknown as Sponsor[];
        // write to local cache
        fs.writeFileSync(SPONSORS_FILE, JSON.stringify(list, null, 2), 'utf-8');
      }
    } catch {
      // DB might be unavailable locally
    }
  }

  // If still empty, seed default initial sponsor
  if (list.length === 0) {
    list = DEFAULT_INITIAL_SPONSORS;
    saveSponsors(list).catch(() => {});
  }

  // Return list with computed metrics
  return list.map(computeSponsorMetrics);
}

/**
 * Saves sponsors to local JSON file AND persists to database setting
 */
export async function saveSponsors(sponsors: Sponsor[]): Promise<void> {
  ensureDataDir();
  // Strip computed fields before saving
  const cleanList = sponsors.map((s) => {
    const copy = { ...s };
    delete copy.effectiveStatus;
    delete copy.daysRemaining;
    delete copy.daysOverdue;
    delete copy.isExpired;
    return copy;
  });

  // Write file
  try {
    fs.writeFileSync(SPONSORS_FILE, JSON.stringify(cleanList, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write sponsors.json:', err);
  }

  // Sync to database setting (persists across Render container restarts)
  try {
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: cleanList as any },
      update: { value: cleanList as any },
    });
  } catch (err: any) {
    // Non-fatal if DB is temporarily unreachable
  }
}

/**
 * Public active sponsors to display on website banners
 */
export async function getPublicActiveSponsors(): Promise<Sponsor[]> {
  const all = await getAllSponsors();
  return all.filter(
    (s) => s.isActiveOnWebsite && (s.effectiveStatus === 'PAID_ACTIVE' || s.effectiveStatus === 'TRIAL_ACTIVE')
  );
}

/**
 * Creates a new sponsor application from the website (starts 14-day free trial)
 */
export async function createSponsorApplication(data: {
  businessName: string;
  category: 'HOTEL' | 'FOOD' | 'ADVENTURE' | 'AUTOCARE' | 'RETAIL' | 'OTHER';
  categoryLabel?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  placementSlot: string;
  adHeadline?: string;
  tagline?: string;
  location?: string;
  websiteUrl?: string;
  proposedPerk?: string;
  notes?: string;
}): Promise<Sponsor> {
  const sponsors = await getAllSponsors();
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 86400000); // Exactly 14 days from now

  const newSponsor: Sponsor = {
    id: `sponsor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    businessName: data.businessName.trim(),
    category: data.category,
    categoryLabel: data.categoryLabel || getCategoryLabel(data.category),
    contactPerson: data.contactPerson.trim(),
    phone: data.phone.trim(),
    email: data.email?.trim() || null,
    placementSlot: data.placementSlot || 'Local Partner Banner',
    adHeadline: data.adHeadline?.trim() || data.businessName.trim(),
    tagline: data.tagline?.trim() || null,
    location: data.location?.trim() || 'Naga City & Camarines Sur',
    websiteUrl: data.websiteUrl?.trim() || null,
    proposedPerk: data.proposedPerk?.trim() || null,
    monthlyFee: 3000,
    status: 'TRIAL_ACTIVE',
    trialStartsAt: now.toISOString(),
    trialEndsAt: trialEnd.toISOString(),
    paidUntil: null,
    isActiveOnWebsite: true,
    paymentHistory: [],
    notes: data.notes?.trim() || '14-Day Free Trial initiated from website inquiry form.',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  sponsors.unshift(newSponsor);
  await saveSponsors(sponsors);
  return computeSponsorMetrics(newSponsor);
}

/**
 * Records a ₱3,000 monthly sponsor fee payment (via GCash, Maya, Bank Transfer, or Cash)
 */
export async function recordSponsorPayment(
  sponsorId: string,
  paymentData: {
    amount: number;
    method: 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CASH';
    referenceNo: string;
    daysToAdd?: number; // defaults to 30 days
    notes?: string;
    recordedBy?: string;
  }
): Promise<Sponsor> {
  const sponsors = await getAllSponsors();
  const idx = sponsors.findIndex((s) => s.id === sponsorId);
  if (idx === -1) {
    throw new Error('Sponsor not found');
  }

  const sponsor = sponsors[idx];
  const now = Date.now();
  const daysToAdd = Number(paymentData.daysToAdd) || 30; // 1 month

  // Determine starting date for extension:
  // If already paid and paidUntil is in the future, extend from paidUntil.
  // Otherwise, extend from today.
  let baseTime = now;
  if (sponsor.paidUntil && new Date(sponsor.paidUntil).getTime() > now) {
    baseTime = new Date(sponsor.paidUntil).getTime();
  }
  const newPaidUntil = new Date(baseTime + daysToAdd * 86400000).toISOString();

  const paymentRecord: SponsorPaymentRecord = {
    id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount: Number(paymentData.amount) || 3000,
    paidAt: new Date().toISOString(),
    method: paymentData.method,
    referenceNo: paymentData.referenceNo.trim(),
    daysAdded: daysToAdd,
    recordedBy: paymentData.recordedBy || 'Admin',
    notes: paymentData.notes?.trim() || '',
  };

  sponsor.paymentHistory = sponsor.paymentHistory || [];
  sponsor.paymentHistory.unshift(paymentRecord);
  sponsor.paidUntil = newPaidUntil;
  sponsor.status = 'PAID_ACTIVE';
  sponsor.isActiveOnWebsite = true;
  sponsor.updatedAt = new Date().toISOString();

  sponsors[idx] = sponsor;
  await saveSponsors(sponsors);
  return computeSponsorMetrics(sponsor);
}

/**
 * Toggles banner visibility on the public website
 */
export async function toggleSponsorActive(sponsorId: string, isActive: boolean): Promise<Sponsor> {
  const sponsors = await getAllSponsors();
  const idx = sponsors.findIndex((s) => s.id === sponsorId);
  if (idx === -1) {
    throw new Error('Sponsor not found');
  }

  sponsors[idx].isActiveOnWebsite = isActive;
  sponsors[idx].updatedAt = new Date().toISOString();

  await saveSponsors(sponsors);
  return computeSponsorMetrics(sponsors[idx]);
}

/**
 * Updates sponsor data (notes, contact info, headline, etc.)
 */
export async function updateSponsor(sponsorId: string, updates: Partial<Sponsor>): Promise<Sponsor> {
  const sponsors = await getAllSponsors();
  const idx = sponsors.findIndex((s) => s.id === sponsorId);
  if (idx === -1) {
    throw new Error('Sponsor not found');
  }

  const updated: Sponsor = {
    ...sponsors[idx],
    ...updates,
    id: sponsorId, // immutable
    updatedAt: new Date().toISOString(),
  };

  sponsors[idx] = updated;
  await saveSponsors(sponsors);
  return computeSponsorMetrics(updated);
}

/**
 * Deletes a sponsor
 */
export async function deleteSponsor(sponsorId: string): Promise<boolean> {
  let sponsors = await getAllSponsors();
  const beforeLen = sponsors.length;
  sponsors = sponsors.filter((s) => s.id !== sponsorId);
  if (sponsors.length === beforeLen) {
    return false;
  }
  await saveSponsors(sponsors);
  return true;
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'HOTEL':
      return 'Hotels & Lodging';
    case 'FOOD':
      return 'Restaurants & Cafes';
    case 'ADVENTURE':
      return 'Adventure & Tours';
    case 'AUTOCARE':
      return 'Auto Care & Detailing';
    case 'RETAIL':
      return 'Pasalubong & Shopping';
    default:
      return 'Local Business Partner';
  }
}
