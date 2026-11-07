import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { sendEmail } from './notification.service';
import { env } from '../config/env';

export interface Quotation {
  id: string;
  templateType: 'STANDARD' | 'EXECUTIVE' | 'TOUR' | 'AIRPORT' | 'CUSTOM';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleName: string;
  rentalType: 'SELF_DRIVE' | 'WITH_DRIVER';
  destinationName: string;
  pickupDate: string;
  returnDate: string;
  durationLabel: string;
  baseRate: number;
  driverFee: number;
  deliveryFee: number;
  discount: number;
  securityDeposit: number;
  reservationFee: number;
  totalRentalAmount: number;
  balanceUponRelease: number;
  validUntil: string;
  inclusions: string[];
  termsAndConditions: string[];
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CustomerInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  inquiryType: string;
  preferredVehicle?: string;
  message: string;
  status: 'PENDING' | 'QUOTED' | 'RESOLVED';
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const QUOTATIONS_FILE = path.join(DATA_DIR, 'quotations.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const QUOTATION_TEMPLATES = [
  {
    type: 'STANDARD',
    name: 'Standard Self-Drive Getaway',
    description: 'Ideal for personal trips, weekend getaways, and daily city rentals in Naga & Camarines Sur.',
    rentalType: 'SELF_DRIVE' as const,
    vehicleName: 'Toyota Vios 2025 AT (Dual VVT-i)',
    destinationName: 'Naga City & Camarines Sur',
    durationLabel: '24 Hours (1 Day)',
    baseRate: 1800,
    driverFee: 0,
    deliveryFee: 0,
    discount: 0,
    securityDeposit: 3000,
    reservationFee: 500,
    pickupLocation: 'Custoworks Garage, Naga City',
    dropoffLocation: 'Custoworks Garage, Naga City',
    inclusions: [
      'Comprehensive Third-Party Liability Insurance',
      '24/7 Bicol Roadside Assistance Support',
      'Full AC & Sanitized Interior upon release',
      'Free Naga City Central Garage pickup & return',
    ],
    termsAndConditions: [
      'Valid Philippine Driver’s License and verified LTMS QR code required upon turnover.',
      '₱500 reservation fee required to confirm and block calendar dates (GCash: 0961 722 5326 / 0995 382 7972).',
      'Refundable security deposit of ₱3,000 returned on the spot upon inspection.',
      'Vehicle returned with equal fuel level and clean exterior (₱300 carwash deduction only if unwashed).',
    ],
  },
  {
    type: 'EXECUTIVE',
    name: 'Executive / Corporate Chauffeur Service',
    description: 'Professional with-driver service for business meetings, conferences, VIP guests, and weddings.',
    rentalType: 'WITH_DRIVER' as const,
    vehicleName: 'Toyota Innova 2.8 Diesel AT',
    destinationName: 'Naga Metro & Regional Bicol',
    durationLabel: '12 Hours Day Tour',
    baseRate: 2500,
    driverFee: 800,
    deliveryFee: 0,
    discount: 0,
    securityDeposit: 0,
    reservationFee: 500,
    pickupLocation: 'Hotel / Office Meetup in Naga City',
    dropoffLocation: 'Hotel / Office Dropoff in Naga City',
    inclusions: [
      'Professional, courteous, uniformed local Bicolano chauffeur',
      'Zero security deposit required',
      'No driver’s license or LTMS verification needed from renter',
      'Driver meals and local navigation guidance included',
      'Complimentary bottled water and sanitizers inside vehicle',
    ],
    termsAndConditions: [
      '₱500 reservation fee blocks vehicle and chauffeur schedule (GCash: 0961 722 5326 / 0995 382 7972).',
      'Remaining balance settled upon vehicle pickup or completion of service.',
      'Overtime fee of ₱200/hour applies beyond the 12-hour booking window.',
    ],
  },
  {
    type: 'TOUR',
    name: 'Bicol Region Explorer (Albay / Caramoan / Daet)',
    description: 'Spacious 15-passenger van rental for multi-day group tours, family reunions, and provincial circuits.',
    rentalType: 'WITH_DRIVER' as const,
    vehicleName: 'Nissan NV350 Urvan Premium (15-Seater)',
    destinationName: 'Albay / Daet / Caramoan Tour Route',
    durationLabel: '24 Hours Multi-Destination',
    baseRate: 4800,
    driverFee: 1000,
    deliveryFee: 0,
    discount: 500,
    securityDeposit: 0,
    reservationFee: 500,
    pickupLocation: 'Naga City Meetup / Terminal Pickup',
    dropoffLocation: 'Naga City Meetup / Terminal Dropoff',
    inclusions: [
      'High-roof 15-seater Nissan NV350 with dual cool air-conditioning',
      'Dedicated mountain-road experienced professional driver',
      'Zero driver’s license needed from passengers',
      'Zero security deposit required',
      'Luggage assistance and itinerary route optimization',
    ],
    termsAndConditions: [
      'Fuel, highway toll fees, and destination parking tickets are on passenger account.',
      '₱500 reservation fee locks the van for declared dates (GCash: 0961 722 5326 / 0995 382 7972).',
      'Driver lodging/meal allowance provided or shouldered if overnight outside Naga City.',
    ],
  },
  {
    type: 'AIRPORT',
    name: 'Naga / Bicol Airport Transfer & Meetup',
    description: 'Guaranteed airport arrival and departure transfer with flight delay buffer.',
    rentalType: 'WITH_DRIVER' as const,
    vehicleName: 'Toyota Vios or Innova MPV',
    destinationName: 'Naga Airport (WNP Pili) to Naga Metro',
    durationLabel: 'One-Way Transfer / Meetup',
    baseRate: 1200,
    driverFee: 300,
    deliveryFee: 0,
    discount: 0,
    securityDeposit: 0,
    reservationFee: 500,
    pickupLocation: 'Naga Airport (WNP - Pili, Camarines Sur)',
    dropoffLocation: 'Hotel / Residence in Naga City',
    inclusions: [
      'Nameboard greeting at flight arrival terminal',
      'Flight delay tracking (no extra charge for delayed flights)',
      'Luggage loading and direct drop-off at your hotel or event',
    ],
    termsAndConditions: [
      'Flight details (Flight #, Airline, ETA) required upon reservation.',
      'Advance ₱500 reservation fee ensures dedicated waiting vehicle (GCash: 0961 722 5326 / 0995 382 7972).',
    ],
  },
  {
    type: 'CUSTOM',
    name: 'Custom Tailored Quotation',
    description: 'Custom vehicle, customized itinerary, personalized pricing, and specific inclusions.',
    rentalType: 'SELF_DRIVE' as const,
    vehicleName: 'Toyota Vios 2025 AT',
    destinationName: 'Custom Travel Itinerary',
    durationLabel: 'Custom Duration',
    baseRate: 1800,
    driverFee: 0,
    deliveryFee: 0,
    discount: 0,
    securityDeposit: 3000,
    reservationFee: 500,
    pickupLocation: 'Custoworks Garage, Naga City',
    dropoffLocation: 'Custoworks Garage, Naga City',
    inclusions: [
      'Third-Party Liability Insurance',
      '24/7 Bicol Roadside Assistance',
      'Clean & sanitized vehicle condition',
    ],
    termsAndConditions: [
      'Valid IDs and driver license / LTMS required for self-drive.',
      '₱500 reservation fee required to lock the calendar (GCash: 0961 722 5326 / 0995 382 7972).',
    ],
  },
];

export function getInquiries(): CustomerInquiry[] {
  ensureDataDir();
  if (!fs.existsSync(INQUIRIES_FILE)) {
    const initialInquiries: CustomerInquiry[] = [
      {
        id: 'INQ-2026-781920',
        name: 'Maria Santos',
        email: 'maria.santos@gmail.com',
        phone: '0917 123 4567',
        subject: 'Weekend Innova rental to Caramoan',
        inquiryType: 'BOOKING',
        preferredVehicle: 'Toyota Innova 2.8 Diesel AT',
        message: 'Hi! We are planning a 3-day family weekend trip to Caramoan. Can we get an official quotation with driver vs self-drive options?',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'INQ-2026-442119',
        name: 'Atty. Victor Cruz',
        email: 'victor.cruz@lawfirm.ph',
        phone: '0998 555 1234',
        subject: 'Corporate Shuttle Service in Naga City',
        inquiryType: 'CORPORATE',
        preferredVehicle: 'Nissan NV350 Urvan Premium (15-Seater)',
        message: 'Good day. We need a 15-seater van with driver for our upcoming regional conference attendees in Naga City for 2 full days.',
        status: 'QUOTED',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(initialInquiries, null, 2), 'utf-8');
    return initialInquiries;
  }
  try {
    const content = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
    return JSON.parse(content) || [];
  } catch {
    return [];
  }
}

export function saveInquiry(inquiry: CustomerInquiry): CustomerInquiry {
  const inquiries = getInquiries();
  inquiries.unshift(inquiry);
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');
  return inquiry;
}

export function updateInquiryStatus(id: string, status: CustomerInquiry['status']): boolean {
  const inquiries = getInquiries();
  const target = inquiries.find((i) => i.id === id);
  if (target) {
    target.status = status;
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');
    return true;
  }
  return false;
}

export function getQuotations(): Quotation[] {
  ensureDataDir();
  if (!fs.existsSync(QUOTATIONS_FILE)) {
    const sampleDate = new Date();
    sampleDate.setDate(sampleDate.getDate() + 3);
    const returnDate = new Date(sampleDate);
    returnDate.setDate(returnDate.getDate() + 2);

    const initialQuotations: Quotation[] = [
      {
        id: 'QT-2026-00101',
        templateType: 'STANDARD',
        customerName: 'Atty. Victor Cruz',
        customerEmail: 'victor.cruz@lawfirm.ph',
        customerPhone: '0998 555 1234',
        pickupLocation: 'SM City Naga Meetup',
        dropoffLocation: 'SM City Naga Meetup',
        vehicleName: 'Toyota Innova 2.8 Diesel AT',
        rentalType: 'WITH_DRIVER',
        destinationName: 'Naga City & Camarines Sur',
        pickupDate: sampleDate.toISOString(),
        returnDate: returnDate.toISOString(),
        durationLabel: '2 Days (48 Hours)',
        baseRate: 5000,
        driverFee: 1600,
        deliveryFee: 0,
        discount: 400,
        securityDeposit: 0,
        reservationFee: 500,
        totalRentalAmount: 6200,
        balanceUponRelease: 5700,
        validUntil: new Date(Date.now() + 86400000 * 7).toISOString(),
        inclusions: [
          'Professional courteous chauffeur',
          'Zero security deposit required',
          '24/7 Bicol Roadside Assistance',
          'Sanitized cool interior',
        ],
        termsAndConditions: [
          '₱500 reservation fee locks calendar dates and vehicle assignment.',
          'Balance payable upon meetup in Naga City.',
        ],
        notes: 'Requested pickup at SM City Naga main entrance by 8:00 AM.',
        status: 'SENT',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        createdBy: 'Admin Operations',
      },
    ];
    fs.writeFileSync(QUOTATIONS_FILE, JSON.stringify(initialQuotations, null, 2), 'utf-8');
    return initialQuotations;
  }
  try {
    const content = fs.readFileSync(QUOTATIONS_FILE, 'utf-8');
    return JSON.parse(content) || [];
  } catch {
    return [];
  }
}

export function saveQuotation(quotation: Quotation): Quotation {
  const quotations = getQuotations();
  const existingIdx = quotations.findIndex((q) => q.id === quotation.id);
  if (existingIdx >= 0) {
    quotations[existingIdx] = quotation;
  } else {
    quotations.unshift(quotation);
  }
  fs.writeFileSync(QUOTATIONS_FILE, JSON.stringify(quotations, null, 2), 'utf-8');
  return quotation;
}

export function deleteQuotation(id: string): boolean {
  const quotations = getQuotations();
  const filtered = quotations.filter((q) => q.id !== id);
  if (filtered.length !== quotations.length) {
    fs.writeFileSync(QUOTATIONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
  return false;
}

export function generateQuotationPdfBuffer(q: Quotation): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    const NAVY = '#0b1f4b';
    const BLUE = '#2563eb';
    const SLATE = '#475569';
    const LIGHT_BG = '#f8fafc';
    const BORDER = '#cbd5e1';

    // Top Header Banner
    doc.rect(0, 0, doc.page.width, 75).fill(NAVY);
    const logoFile = path.resolve(process.cwd(), 'assets', 'logo.jpg');
    if (fs.existsSync(logoFile)) {
      try {
        doc.image(logoFile, 40, 10, { width: 55, height: 55 });
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('CUSTOWORKS CAR RENTAL', 105, 18);
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text('Carnation St. CBD II Brgy Triangulo (Beside SM), Naga City 4400  |  Hotlines: 0961 722 5326 / 0995 382 7972', 105, 40);
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text('custoworks1@gmail.com  |  facebook.com/CustoWorkss', 105, 52);
      } catch {
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('CUSTOWORKS CAR RENTAL', 40, 20);
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text('Carnation St. CBD II Brgy Triangulo (Beside SM), Naga City 4400  |  Hotlines: 0961 722 5326 / 0995 382 7972  |  custoworks1@gmail.com', 40, 48);
      }
    } else {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('CUSTOWORKS CAR RENTAL', 40, 20);
      doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text('Carnation St. CBD II Brgy Triangulo (Beside SM), Naga City 4400  |  Hotlines: 0961 722 5326 / 0995 382 7972  |  custoworks1@gmail.com', 40, 48);
    }

    // Title Badge
    doc.roundedRect(40, 90, 180, 24, 4).fill(BLUE);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('OFFICIAL RENTAL QUOTATION', 48, 97);

    // Quotation Details
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(`Quotation #: ${q.id}`, 380, 92, { align: 'right', width: 175 });
    doc.font('Helvetica').fontSize(9).fillColor(SLATE).text(`Date Issued: ${new Date(q.createdAt).toLocaleDateString()}`, 380, 106, { align: 'right', width: 175 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#dc2626').text(`Valid Until: ${new Date(q.validUntil).toLocaleDateString()}`, 380, 120, { align: 'right', width: 175 });

    // Client Info Box
    doc.rect(40, 140, doc.page.width - 80, 58).fillAndStroke(LIGHT_BG, BORDER);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text('CLIENT & TRIP INFORMATION', 52, 148);

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b').text('Client Name:', 52, 166);
    doc.font('Helvetica').fontSize(9).text(q.customerName, 125, 166);

    doc.font('Helvetica-Bold').fontSize(9).text('Contact Phone:', 52, 180);
    doc.font('Helvetica').fontSize(9).text(q.customerPhone || 'N/A', 125, 180);

    doc.font('Helvetica-Bold').fontSize(9).text('Email Address:', 310, 166);
    doc.font('Helvetica').fontSize(9).text(q.customerEmail, 395, 166);

    doc.font('Helvetica-Bold').fontSize(9).text('Rental Mode:', 310, 180);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text(q.rentalType === 'WITH_DRIVER' ? 'With Driver (Chauffeur Service)' : 'Self-Drive (LTMS Verified)', 395, 180);

    // Vehicle & Trip Details Box
    doc.rect(40, 208, doc.page.width - 80, 72).fillAndStroke(LIGHT_BG, BORDER);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text('VEHICLE & RESERVATION SCHEDULE', 52, 216);

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b').text('Reserved Vehicle:', 52, 234);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text(q.vehicleName, 145, 234);

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b').text('Destination Route:', 52, 248);
    doc.font('Helvetica').fontSize(9).text(q.destinationName, 145, 248);

    doc.font('Helvetica-Bold').fontSize(9).text('Rental Duration:', 52, 262);
    doc.font('Helvetica').fontSize(9).text(q.durationLabel, 145, 262);

    doc.font('Helvetica-Bold').fontSize(9).text('Pickup / Meetup:', 310, 234);
    doc.font('Helvetica').fontSize(9).text(q.pickupLocation, 395, 234, { width: 155 });

    doc.font('Helvetica-Bold').fontSize(9).text('Return Location:', 310, 256);
    doc.font('Helvetica').fontSize(9).text(q.dropoffLocation, 395, 256, { width: 155 });

    // Itemized Table
    let tableY = 292;
    doc.rect(40, tableY, doc.page.width - 80, 24).fill(NAVY);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('ITEM DESCRIPTION', 52, tableY + 7);
    doc.text('AMOUNT (PHP)', 440, tableY + 7, { align: 'right', width: 105 });

    tableY += 24;

    const items = [
      { desc: `Base Vehicle Rental (${q.durationLabel})`, amt: `PHP ${q.baseRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    ];
    if (q.driverFee > 0) {
      items.push({ desc: 'Professional Driver Allowance & Chauffeur Service', amt: `PHP ${q.driverFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
    }
    if (q.deliveryFee > 0) {
      items.push({ desc: 'Vehicle Delivery / Meetup Service Fee', amt: `PHP ${q.deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
    }
    if (q.discount > 0) {
      items.push({ desc: 'Package / Promotional Discount', amt: `- PHP ${q.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
    }

    items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, tableY, doc.page.width - 80, 20).fillAndStroke(bg, '#e2e8f0');
      doc.fillColor('#1e293b').font('Helvetica').fontSize(9).text(item.desc, 52, tableY + 5);
      doc.font('Helvetica-Bold').text(item.amt, 440, tableY + 5, { align: 'right', width: 105 });
      tableY += 20;
    });

    // Total Row
    doc.rect(40, tableY, doc.page.width - 80, 24).fillAndStroke('#eff6ff', BLUE);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text('TOTAL ESTIMATED RENTAL COST', 52, tableY + 7);
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(11).text(`PHP ${q.totalRentalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 420, tableY + 6, { align: 'right', width: 125 });

    tableY += 32;

    // Payment Terms Box
    doc.rect(40, tableY, doc.page.width - 80, 52).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(9);
    doc.text(`Required Reservation Fee to Lock Dates: PHP ${q.reservationFee.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Deducted from balance)`, 52, tableY + 8);
    doc.text(`Remaining Balance Due Upon Release: PHP ${q.balanceUponRelease.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 52, tableY + 22);
    if (q.securityDeposit > 0) {
      doc.fillColor('#b45309').text(`Refundable Security Deposit: PHP ${q.securityDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Refunded on the spot upon clean return)`, 52, tableY + 36);
    } else {
      doc.fillColor('#15803d').text('Refundable Security Deposit: PHP 0.00 (Zero security deposit for with-driver rentals)', 52, tableY + 36);
    }

    tableY += 62;

    // Inclusions & Terms
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text('INCLUSIONS & BOOKING TERMS', 40, tableY);
    tableY += 14;

    q.inclusions.slice(0, 4).forEach((inc) => {
      doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(8).text('✓ ', 45, tableY);
      doc.fillColor('#334155').font('Helvetica').fontSize(8).text(inc, 58, tableY, { width: 490 });
      tableY += 12;
    });

    tableY += 4;
    q.termsAndConditions.slice(0, 3).forEach((term) => {
      doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(8).text('• ', 45, tableY);
      doc.fillColor('#334155').font('Helvetica').fontSize(8).text(term, 58, tableY, { width: 490 });
      tableY += 12;
    });

    if (q.notes) {
      tableY += 6;
      doc.rect(40, tableY, doc.page.width - 80, 24).fillAndStroke('#fffbeb', '#fde68a');
      doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(8).text(`Special Note: ${q.notes}`, 50, tableY + 7, { width: 500 });
      tableY += 30;
    } else {
      tableY += 10;
    }

    // Bottom Official Signature / Verification Box
    doc.rect(40, doc.page.height - 75, doc.page.width - 80, 45).fillAndStroke(NAVY, NAVY);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('HOW TO CONFIRM & LOCK YOUR SCHEDULE:', 52, doc.page.height - 68);
    doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1').text(
      `Send PHP ${q.reservationFee.toLocaleString()} reservation fee via GCash (Jericho Oclares - 0995 382 7972) or BDO (Jericho Oclares - 0051 6059 4036). Contact: 0961 722 5326 | 0995 382 7972.`,
      52,
      doc.page.height - 54
    );
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#38bdf8').text('CUSTOWORKS CAR RENTAL NAGA CITY  |  OFFICIAL AUTHORIZED QUOTATION', 52, doc.page.height - 40);

    doc.end();
  });
}

export async function sendQuotationEmail(quotation: Quotation): Promise<{ success: boolean; error?: string }> {
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateQuotationPdfBuffer(quotation);
  } catch (err: any) {
    console.error('Failed to generate quotation PDF buffer:', err);
  }

  const subject = `[Custoworks Car Rental] Official Rental Quotation #${quotation.id} for ${quotation.customerName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
      <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; letter-spacing: 1px;">CUSTOWORKS CAR RENTAL</h1>
        <p style="color: #475569; margin: 4px 0 0; font-size: 13px;"><strong>Carnation Street CBD II Brgy. Triangulo (Beside SM), Naga City, Philippines, 4400</strong></p>
        <p style="color: #64748b; margin: 4px 0 0; font-size: 12px;">Hotlines: 0961 722 5326 (Primary) / 0995 382 7972 (Secondary) | custoworks1@gmail.com</p>
        <p style="margin: 4px 0 0; font-size: 12px;"><a href="https://www.facebook.com/CustoWorkss" style="color: #2563eb; font-weight: bold; text-decoration: none;">facebook.com/CustoWorkss</a></p>
        <div style="margin-top: 10px; display: inline-block; background: #dbeafe; color: #1d4ed8; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 9999px;">
          OFFICIAL RENTAL QUOTATION
        </div>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0; color: #1e40af; font-size: 13px; font-weight: bold;">
          📎 An official PDF copy of this quotation is attached to this email.
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
        <div>
          <p style="margin: 2px 0;"><strong>Quotation #:</strong> ${quotation.id}</p>
          <p style="margin: 2px 0;"><strong>Prepared For:</strong> ${quotation.customerName}</p>
          <p style="margin: 2px 0;"><strong>Phone:</strong> ${quotation.customerPhone}</p>
          <p style="margin: 2px 0;"><strong>Email:</strong> ${quotation.customerEmail}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 2px 0;"><strong>Date Issued:</strong> ${new Date(quotation.createdAt).toLocaleDateString()}</p>
          <p style="margin: 2px 0; color: #dc2626;"><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>
          <p style="margin: 2px 0;"><strong>Rental Mode:</strong> ${quotation.rentalType === 'WITH_DRIVER' ? 'With Driver (Chauffeur)' : 'Self-Drive (LTMS Verified)'}</p>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Vehicle & Schedule Details</h3>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Vehicle:</strong> <span style="color: #2563eb; font-weight: bold;">${quotation.vehicleName}</span></p>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Destination:</strong> ${quotation.destinationName}</p>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Duration:</strong> ${quotation.durationLabel}</p>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Pickup:</strong> ${new Date(quotation.pickupDate).toLocaleString()} (${quotation.pickupLocation})</p>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Return:</strong> ${new Date(quotation.returnDate).toLocaleString()} (${quotation.dropoffLocation})</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
        <thead>
          <tr style="background: #0f172a; color: white;">
            <th style="padding: 10px; text-align: left;">Item Description</th>
            <th style="padding: 10px; text-align: right;">Amount (PHP)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Base Vehicle Rental (${quotation.durationLabel})</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">₱${quotation.baseRate.toLocaleString()}</td>
          </tr>
          ${quotation.driverFee > 0 ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Professional Driver Allowance / Service</td>
            <td style="padding: 10px; text-align: right;">₱${quotation.driverFee.toLocaleString()}</td>
          </tr>` : ''}
          ${quotation.deliveryFee > 0 ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Delivery / Meetup Service Fee</td>
            <td style="padding: 10px; text-align: right;">₱${quotation.deliveryFee.toLocaleString()}</td>
          </tr>` : ''}
          ${quotation.discount > 0 ? `
          <tr style="border-bottom: 1px solid #e2e8f0; color: #16a34a;">
            <td style="padding: 10px;">Promo / Package Discount</td>
            <td style="padding: 10px; text-align: right;">- ₱${quotation.discount.toLocaleString()}</td>
          </tr>` : ''}
          <tr style="background: #f1f5f9; font-weight: bold; font-size: 14px;">
            <td style="padding: 12px; color: #0f172a;">Total Estimated Rental Cost</td>
            <td style="padding: 12px; text-align: right; color: #1e3a8a;">₱${quotation.totalRentalAmount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
        <p style="margin: 4px 0;"><strong>Required Reservation Fee:</strong> <span style="color: #2563eb; font-weight: bold;">₱${quotation.reservationFee.toLocaleString()}</span> (To lock dates & hold car)</p>
        <p style="margin: 4px 0;"><strong>Remaining Balance Upon Vehicle Turnover:</strong> <span style="font-weight: bold;">₱${quotation.balanceUponRelease.toLocaleString()}</span></p>
        ${quotation.securityDeposit > 0 ? `<p style="margin: 4px 0; color: #d97706;"><strong>Refundable Security Deposit:</strong> ₱${quotation.securityDeposit.toLocaleString()} (Refunded on the spot upon clean return)</p>` : '<p style="margin: 4px 0; color: #16a34a;"><strong>Security Deposit:</strong> ₱0 (No deposit required for with-driver service)</p>'}
      </div>

      <div style="margin-bottom: 20px; font-size: 12px; color: #475569;">
        <h4 style="color: #1e293b; margin-bottom: 6px; font-size: 13px;">Included in this Quotation:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${quotation.inclusions.map((inc) => `<li style="margin-bottom: 3px;">${inc}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom: 20px; font-size: 12px; color: #475569;">
        <h4 style="color: #1e293b; margin-bottom: 6px; font-size: 13px;">Important Terms & Next Steps:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${quotation.termsAndConditions.map((term) => `<li style="margin-bottom: 3px;">${term}</li>`).join('')}
        </ul>
      </div>

      ${quotation.notes ? `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; font-size: 12px; color: #92400e; margin-bottom: 20px;">
        <strong>Special Notes:</strong> ${quotation.notes}
      </div>` : ''}

      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b;">
        <p style="margin: 2px 0;">To accept this quotation or block your dates, reply to this email or call/text <strong>0961 722 5326</strong> / <strong>0995 382 7972</strong>.</p>
        <p style="margin: 2px 0;">Payment Methods: <strong>GCash (Primary: 0961 722 5326 / Secondary: 0995 382 7972)</strong>, Maya, BPI, BDO Bank Transfer</p>
        <p style="margin: 3px 0;"><a href="https://www.facebook.com/CustoWorkss" style="color: #2563eb; font-weight: bold; text-decoration: none;">Facebook Page: facebook.com/CustoWorkss</a></p>
        <p style="margin: 8px 0 0; font-weight: bold; color: #1e3a8a;">Custoworks Car Rental Services</p>
        <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">Carnation Street CBD II Brgy Triangulo (Beside SM), Naga City, Philippines, 4400</p>
      </div>
    </div>
  `;

  const attachments = pdfBuffer
    ? [
        {
          filename: `Custoworks-Quotation-${quotation.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
    : undefined;

  try {
    await sendEmail(
      quotation.customerEmail,
      subject,
      html,
      `Custoworks Rental Quotation #${quotation.id}\nPrepared for: ${quotation.customerName}\nVehicle: ${quotation.vehicleName}\nTotal: PHP ${quotation.totalRentalAmount}\nReservation Fee: PHP ${quotation.reservationFee}\nHotlines: 0961 722 5326 / 0995 382 7972\nEmail: custoworks1@gmail.com\n\nPlease find your official quotation PDF attached.`,
      attachments
    );
    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error('Failed to send quotation email:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
