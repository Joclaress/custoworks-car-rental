import { prisma, type Tx } from '../lib/prisma';

/** Default business settings. Stored in the `settings` table and editable by admins. */
export const DEFAULT_SETTINGS = {
  company: {
    name: 'CUSTOWORKS CAR RENTAL',
    tagline: 'Self-drive & with-driver car rental in Naga City',
    phone: '0961 722 5326 / 0995 382 7972',
    primaryPhone: '0961 722 5326',
    secondaryPhone: '0995 382 7972',
    email: 'custoworks1@gmail.com',
    location: 'Carnation Street CBD ll Brgy Triangulo (Beside SM), Naga City, Philippines, 4400',
    facebook: 'Custoworks Car Rental',
    facebookUrl: 'https://www.facebook.com/CustoWorkss',
    officeHours: '8:00 AM – 8:00 PM (24/7 Vehicle releases with reservation)',
  },
  booking: {
    reservationFee: 500,
    /** Minutes a DRAFT booking holds the vehicle while the customer completes the wizard. */
    draftHoldMinutes: 30,
    /** Hours a submitted booking waits for the reservation-fee payment before it expires. */
    paymentHoldHours: 24,
    /** Minimum hours between "now" and pick-up. */
    minLeadHours: 2,
    /** Maximum number of unpaid holds (draft / pending payment) per customer. */
    maxActiveHoldsPerCustomer: 3,
    /** Maximum rental length in days. */
    maxRentalDays: 90,
    /** Hours before pick-up when reminders are sent. */
    reminderHoursBefore: 24,
  },
  securityDeposit: {
    /** Recorded separately from the reservation fee – never combined. */
    enabled: false,
    amount: null as number | null,
    notes: 'Security deposit (if required) is collected upon vehicle pick-up and refunded after the return inspection, subject to the rental agreement.',
  },
  policies: [
    'PHP 500 reservation fee is required to block the selected date.',
    'Full payment of the remaining rental balance is required upon vehicle pick-up.',
    'Cancellation and rescheduling are subject to company policy.',
    'The reservation fee is non-refundable for customer-initiated cancellations, subject to applicable law and approved exceptions.',
    'Rescheduling requests are subject to vehicle availability.',
    'A security deposit, if collected, is recorded separately from the reservation fee and refunded according to the return inspection and rental agreement.',
  ],
  rentalTerms: [
    'The renter must present the original documents submitted online upon vehicle pick-up.',
    'The vehicle must be returned on the agreed date, time and place. Late returns may be charged according to the applicable rate.',
    'The vehicle may only be used within the destination declared in the booking.',
    'Only the approved renter/driver may drive a self-drive vehicle.',
    'Traffic violations, tolls, fuel and parking fees during the rental period are the responsibility of the renter.',
    'Any damage or loss during the rental period shall be assessed during the return inspection and charged in accordance with this agreement.',
    'Smoking, illegal activities and overloading are strictly prohibited inside the vehicle.',
  ],
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingsKey = keyof Settings;

let cache: { at: number; value: Settings } | null = null;

export async function getSettings(tx: Tx | typeof prisma = prisma): Promise<Settings> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const rows = await tx.setting.findMany();
  const merged = structuredClone(DEFAULT_SETTINGS) as Record<string, unknown>;
  for (const r of rows) {
    const def = merged[r.key];
    merged[r.key] =
      def && typeof def === 'object' && !Array.isArray(def) && r.value && typeof r.value === 'object' && !Array.isArray(r.value)
        ? { ...(def as object), ...(r.value as object) }
        : r.value;
  }
  cache = { at: Date.now(), value: merged as Settings };
  return cache.value;
}

export async function updateSettings(patch: Partial<Settings>) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in DEFAULT_SETTINGS) || value === undefined) continue;
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as never },
      update: { value: value as never },
    });
  }
  cache = null;
  return getSettings();
}
