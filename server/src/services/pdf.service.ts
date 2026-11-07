import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { formatManila } from '../lib/utils';
import { getSettings } from './settings.service';
import { bookingFinancials } from './booking.service';
import { RATE_DURATION_LABEL } from './pricing.service';

// Built-in PDF fonts do not include the ₱ glyph, so PDFs use "PHP".
const php = (v: unknown) => 'PHP ' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NAVY = '#0b1f4b';

function header(doc: PDFKit.PDFDocument, title: string, company: { name: string; phone: string; location: string }) {
  doc.rect(0, 0, doc.page.width, 80).fill(NAVY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(company.name, 50, 24);
  doc.font('Helvetica').fontSize(9).text(`${company.location}  |  ${company.phone}`, 50, 48);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(15).text(title, 50, 100);
  doc.moveDown(0.5).fillColor('#111');
}

function row(doc: PDFKit.PDFDocument, label: string, value: string) {
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333').text(label, 50, y, { width: 170 });
  doc.font('Helvetica').fillColor('#111').text(value, 220, y, { width: 330 });
  doc.moveDown(0.35);
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text(title.toUpperCase(), 50);
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#cbd5e1').stroke();
  doc.moveDown(0.5);
}

export async function streamRentalAgreement(res: Response, bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: true, destination: true, fees: true, agreement: true },
  });
  if (!b) throw AppError.notFound('Booking not found');
  if (!b.agreement) throw AppError.conflict('The rental agreement is generated once the booking is submitted');
  const settings = await getSettings();
  const fin = await bookingFinancials(prisma, b);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="rental-agreement-${b.reference}.pdf"`);
  doc.pipe(res);
  header(doc, 'VEHICLE RENTAL AGREEMENT', settings.company);
  row(doc, 'Agreement No.', b.agreement.agreementNumber);
  row(doc, 'Booking Reference', b.reference);
  row(doc, 'Booking Status', b.status.replace(/_/g, ' '));
  row(doc, 'Date Generated', formatManila(b.agreement.generatedAt));

  section(doc, 'Renter');
  row(doc, 'Name', b.customerName);
  row(doc, 'Mobile / Email', `${b.customerPhone}  /  ${b.customerEmail}`);
  row(doc, 'Address', b.customerAddress ?? '-');
  row(doc, 'Emergency Contact', `${b.emergencyContactName ?? '-'} (${b.emergencyContactPhone ?? '-'})`);
  row(doc, 'Purpose of Rental', b.purpose ?? '-');

  section(doc, 'Vehicle & Schedule');
  row(doc, 'Vehicle', `${b.vehicle.name} (${b.vehicle.transmission}, ${b.vehicle.seats} seats)${b.vehicle.plateNumber ? ' – ' + b.vehicle.plateNumber : ''}`);
  row(doc, 'Rental Type', b.rentalType === 'SELF_DRIVE' ? 'Self Drive' : 'With Driver');
  row(doc, 'Destination', b.destination.name);
  row(doc, 'Pick-up', formatManila(b.pickupAt));
  row(doc, 'Return', formatManila(b.returnAt));
  row(doc, 'Duration', `${b.rentalDays} day(s) / ${b.rentalHours} hour(s) – ${RATE_DURATION_LABEL[b.ratePlan]}`);
  row(doc, 'Pick-up Method', b.pickupMethod === 'DELIVERY' ? `Delivery – ${b.deliveryAddress ?? ''}` : 'Office pick-up');

  section(doc, 'Charges');
  row(doc, 'Rental Fee', php(b.rentalFee));
  for (const f of b.fees) row(doc, f.name, php(f.amount));
  if (Number(b.discount) > 0) row(doc, 'Discount', '- ' + php(b.discount));
  row(doc, 'TOTAL RENTAL AMOUNT', php(b.totalAmount));
  row(doc, 'Reservation Fee Paid', php(fin.reservationFeePaid));
  row(doc, 'Balance Due on Pick-up', php(fin.balanceDue));
  row(doc, 'Security Deposit (separate)', `${php(fin.securityDeposit.held)} held`);

  section(doc, 'Terms & Conditions');
  doc.font('Helvetica').fontSize(9).fillColor('#222');
  for (const raw of b.agreement.termsSnapshot.split('\n')) {
    const line = raw.replace(/₱/g, 'PHP ');
    if (!line.trim()) {
      doc.moveDown(0.4);
      continue;
    }
    const isHeading = line === line.toUpperCase() && /[A-Z]/.test(line);
    doc.font(isHeading ? 'Helvetica-Bold' : 'Helvetica').text(isHeading ? line : `• ${line}`, 50, undefined, { width: 495 });
  }

  doc.moveDown(2);
  const y = doc.y;
  doc.moveTo(50, y + 30).lineTo(250, y + 30).strokeColor('#333').stroke();
  doc.moveTo(330, y + 30).lineTo(530, y + 30).stroke();
  doc.fontSize(9).text('Renter signature over printed name', 50, y + 35);
  doc.text('For CUSTOWORKS CAR RENTAL', 330, y + 35);
  if (b.agreement.acceptedAt)
    doc.moveDown(2).fontSize(8).fillColor('#64748b').text(`Terms accepted online on ${formatManila(b.agreement.acceptedAt)}.`, 50);
  doc.end();
}

export async function streamPaymentReceipt(res: Response, paymentId: string) {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { vehicle: true } }, paymentMethod: true, verifiedBy: { select: { fullName: true } } },
  });
  if (!p) throw AppError.notFound('Payment not found');
  if (p.status !== 'APPROVED') throw AppError.conflict('Receipts are only available for verified payments');
  const settings = await getSettings();
  const doc = new PDFDocument({ size: 'A5', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="receipt-${p.receiptNumber}.pdf"`);
  doc.pipe(res);
  header(doc, 'ACKNOWLEDGEMENT RECEIPT', settings.company);
  const typeLabel: Record<string, string> = {
    RESERVATION_FEE: 'Reservation Fee',
    RENTAL_BALANCE: 'Rental Balance Payment',
    SECURITY_DEPOSIT: 'Security Deposit (refundable)',
    SECURITY_DEPOSIT_REFUND: 'Security Deposit Refund',
    ADDITIONAL_CHARGE: 'Additional Charge',
    REFUND: 'Refund',
  };
  row(doc, 'Receipt No.', p.receiptNumber ?? '-');
  row(doc, 'Booking Ref.', p.booking.reference);
  row(doc, 'Received From', p.booking.customerName);
  row(doc, 'Payment For', typeLabel[p.type]);
  row(doc, 'Vehicle', p.booking.vehicle.name);
  row(doc, 'Method', p.paymentMethod.name);
  row(doc, 'Reference No.', p.referenceNumber ?? '-');
  row(doc, 'Date Paid', formatManila(p.paidAt ?? p.createdAt));
  row(doc, 'Verified', `${formatManila(p.verifiedAt ?? p.updatedAt)} by ${p.verifiedBy?.fullName ?? 'Custoworks'}`);
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(16).fillColor(NAVY).text(`AMOUNT: ${php(p.amount)}`, 50);
  doc.moveDown(1).font('Helvetica').fontSize(8).fillColor('#64748b').text('This is a system-generated acknowledgement receipt.', 50);
  doc.end();
}
