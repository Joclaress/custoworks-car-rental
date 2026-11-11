import fs from 'node:fs';
import path from 'node:path';

export interface ManualTripRevenue {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // e.g. "BIA Airport Pickup & Drop"
  clientName: string;
  vehicleName: string;
  rentalType: 'WITH_DRIVER' | 'SELF_DRIVE';
  grossAmount: number; // e.g. 7500
  driverFee: number; // e.g. 1000
  fuelFee: number; // e.g. 2000 (diesel/gasoline)
  tollOtherFee: number; // e.g. 0
  isTieUp: boolean;
  tieUpPartnerName?: string;
  tieUpPercent?: number; // e.g. 20
  tieUpAmount?: number; // calculated: gross * 20%
  netAmount: number; // calculated profit
  notes?: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const REVENUES_FILE = path.join(DATA_DIR, 'manual-revenues.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllManualRevenues(): ManualTripRevenue[] {
  ensureDataDir();
  if (!fs.existsSync(REVENUES_FILE)) {
    fs.writeFileSync(REVENUES_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }

  try {
    const raw = fs.readFileSync(REVENUES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    // Filter out initial sample if present
    const cleaned = list.filter((r) => r.id !== 'mr-bia-sample-1');
    if (cleaned.length !== list.length) {
      fs.writeFileSync(REVENUES_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
    }
    return cleaned;
  } catch (err) {
    console.error('Failed to read manual revenues file:', err);
    return [];
  }
}

export function saveManualRevenues(revenues: ManualTripRevenue[]): void {
  ensureDataDir();
  fs.writeFileSync(REVENUES_FILE, JSON.stringify(revenues, null, 2), 'utf-8');
}

export function addManualRevenue(data: Partial<ManualTripRevenue>): ManualTripRevenue {
  const revenues = getAllManualRevenues();
  const gross = Number(data.grossAmount) || 0;
  const driver = Number(data.driverFee) || 0;
  const fuel = Number(data.fuelFee) || 0;
  const tollOther = Number(data.tollOtherFee) || 0;

  const isTieUp = Boolean(data.isTieUp);
  const tieUpPercent = isTieUp ? Number(data.tieUpPercent || 20) : 0;
  const tieUpAmount = isTieUp ? Math.round(gross * (tieUpPercent / 100)) : 0;

  const net = Math.max(0, gross - driver - fuel - tollOther - tieUpAmount);

  const entry: ManualTripRevenue = {
    id: data.id || `mr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: data.date || new Date().toISOString().slice(0, 10),
    title: data.title?.trim() || 'Custom Trip / Transfer',
    clientName: data.clientName?.trim() || 'Walk-in Guest',
    vehicleName: data.vehicleName?.trim() || 'Toyota Vios 2025 AT',
    rentalType: data.rentalType || 'WITH_DRIVER',
    grossAmount: gross,
    driverFee: driver,
    fuelFee: fuel,
    tollOtherFee: tollOther,
    isTieUp,
    tieUpPartnerName: isTieUp ? data.tieUpPartnerName?.trim() || 'Tie-Up Partner' : undefined,
    tieUpPercent: isTieUp ? tieUpPercent : undefined,
    tieUpAmount: isTieUp ? tieUpAmount : undefined,
    netAmount: net,
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  revenues.unshift(entry);
  saveManualRevenues(revenues);
  return entry;
}

export function deleteManualRevenue(id: string): boolean {
  const revenues = getAllManualRevenues();
  const filtered = revenues.filter((r) => r.id !== id);
  if (filtered.length !== revenues.length) {
    saveManualRevenues(filtered);
    return true;
  }
  return false;
}

export function getManualRevenueStatsForMonth(year: number, monthIndex: number) {
  const revenues = getAllManualRevenues();
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  const thisMonthList = revenues.filter((r) => r.date.startsWith(monthPrefix));

  const totalGross = thisMonthList.reduce((acc, r) => acc + (Number(r.grossAmount) || 0), 0);
  const totalDriver = thisMonthList.reduce((acc, r) => acc + (Number(r.driverFee) || 0), 0);
  const totalFuel = thisMonthList.reduce((acc, r) => acc + (Number(r.fuelFee) || 0), 0);
  const totalTollOther = thisMonthList.reduce((acc, r) => acc + (Number(r.tollOtherFee) || 0), 0);
  const totalTieUp = thisMonthList.reduce((acc, r) => acc + (Number(r.tieUpAmount) || 0), 0);
  const totalNet = thisMonthList.reduce((acc, r) => acc + (Number(r.netAmount) || 0), 0);

  return {
    thisMonthList,
    totalGross,
    totalDriver,
    totalFuel,
    totalTollOther,
    totalExpenses: totalDriver + totalFuel + totalTollOther,
    totalTieUp,
    totalNet,
    tripCount: thisMonthList.length,
  };
}
