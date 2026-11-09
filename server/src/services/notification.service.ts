import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { formatManila, peso } from '../lib/utils';
import { getSettings } from './settings.service';

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
let transporter: Transporter | null = null;
function getTransport(): Transporter {
  if (transporter) return transporter;

  const host = env.SMTP_HOST || 'smtp.gmail.com';
  const port = env.SMTP_PORT || 465;
  const secure = env.SMTP_SECURE ?? true;
  const user = env.SMTP_USER || 'custoworks1@gmail.com';
  const pass = env.SMTP_PASS || 'fzataexaujzygovd';

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    });
  } else {
    if (env.NODE_ENV === 'production') {
      throw new Error('SMTP credentials are not configured on the production server. Email could not be sent.');
    }
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  attachments?: Array<{ filename: string; content?: any; path?: string; contentType?: string }>
) {
  const transport = getTransport();
  const info = await transport.sendMail({ from: env.MAIL_FROM, to, subject, html, text, attachments });
  console.log(`📧 [mail:sent] to=${to} subject="${subject}" messageId=${info.messageId} (attachments: ${attachments?.length || 0})`);
  return info;
}

/** SMS is a planned enhancement. Plug a provider (Semaphore, Twilio, ...) in here. */
export async function sendSms(_to: string, _message: string) {
  if (!env.SMS_PROVIDER) return { skipped: true };
  // TODO: integrate SMS provider
  return { skipped: true };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
export type NotificationType =
  | 'BOOKING_SUBMITTED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'REQUIREMENTS_MISSING'
  | 'REQUIREMENT_REJECTED'
  | 'REQUIREMENTS_APPROVED'
  | 'BOOKING_CONFIRMED'
  | 'PICKUP_REMINDER'
  | 'BOOKING_RESCHEDULED'
  | 'RESCHEDULE_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_EXPIRED'
  | 'VEHICLE_RELEASED'
  | 'RENTAL_COMPLETED';

type BookingForMail = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

function loadBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: { vehicle: true, destination: true, requirements: true },
  });
}

function templates(type: NotificationType, b: BookingForMail, extra: Record<string, string | undefined>) {
  const ref = b.reference;
  const sched = `${formatManila(b.pickupAt)} → ${formatManila(b.returnAt)}`;
  const missing = b.requirements
    .filter((r) => r.isRequired && !['SUBMITTED', 'APPROVED'].includes(r.status))
    .map((r) => r.name);
  const map: Record<NotificationType, [string, string]> = {
    BOOKING_SUBMITTED: [
      `Booking ${ref} submitted`,
      `Thank you! We received your booking for the ${b.vehicle.name} (${sched}). Please pay the ${peso(b.reservationFee)} reservation fee and upload your proof of payment to secure your schedule.`,
    ],
    PAYMENT_RECEIVED: [
      `Reservation payment received – ${ref}`,
      `We received your reservation payment proof for booking ${ref}. Our team will verify it shortly. Uploaded payments are only considered paid after verification.`,
    ],
    PAYMENT_APPROVED: [
      `Payment approved – ${ref}`,
      `Your reservation fee for booking ${ref} has been verified. ${missing.length ? 'Please upload your remaining rental requirements to continue.' : 'Your rental requirements are now under review.'}`,
    ],
    PAYMENT_REJECTED: [
      `Payment could not be verified – ${ref}`,
      `We could not verify your payment for booking ${ref}. Reason: ${extra.reason ?? 'not specified'}. Please upload a valid proof of payment.`,
    ],
    REQUIREMENTS_MISSING: [
      `Missing requirements – ${ref}`,
      `Booking ${ref} still needs the following requirements: ${missing.join(', ') || extra.list || '-'}. Please upload them from your dashboard.`,
    ],
    REQUIREMENT_REJECTED: [
      `Re-upload needed – ${ref}`,
      `Your document "${extra.name}" for booking ${ref} was not accepted. Reason: ${extra.reason ?? 'not specified'}. Please upload a new copy from your dashboard.`,
    ],
    REQUIREMENTS_APPROVED: [
      `Requirements approved – ${ref}`,
      `All your rental requirements for booking ${ref} have been approved.`,
    ],
    BOOKING_CONFIRMED: [
      `Booking confirmed – ${ref}`,
      `Your booking is CONFIRMED! ${b.vehicle.name}, ${sched}, destination: ${b.destination.name}. Remaining balance due on pick-up: ${extra.balance ?? ''}. Please bring your original documents.`,
    ],
    PICKUP_REMINDER: [
      `Pick-up reminder – ${ref}`,
      `Reminder: your ${b.vehicle.name} rental starts on ${formatManila(b.pickupAt)}. Please bring your original documents and the remaining balance.`,
    ],
    BOOKING_RESCHEDULED: [
      `Booking rescheduled – ${ref}`,
      `Booking ${ref} has been rescheduled to ${sched}.`,
    ],
    RESCHEDULE_REJECTED: [
      `Reschedule request declined – ${ref}`,
      `Your reschedule request for booking ${ref} was declined. ${extra.reason ?? ''}`,
    ],
    BOOKING_CANCELLED: [
      `Booking cancelled – ${ref}`,
      `Booking ${ref} has been cancelled. ${extra.reason ? 'Reason: ' + extra.reason : ''}`,
    ],
    BOOKING_REJECTED: [
      `Booking not approved – ${ref}`,
      `We are sorry, booking ${ref} could not be approved. ${extra.reason ? 'Reason: ' + extra.reason : ''}`,
    ],
    BOOKING_EXPIRED: [
      `Booking expired – ${ref}`,
      `Booking ${ref} expired because it was not completed in time. The vehicle hold has been released. You may create a new booking anytime.`,
    ],
    VEHICLE_RELEASED: [
      `Enjoy your trip – ${ref}`,
      `Your ${b.vehicle.name} has been released. Please return it on ${formatManila(b.returnAt)}. Drive safely!`,
    ],
    RENTAL_COMPLETED: [
      `Rental completed – ${ref}`,
      `Thank you for renting with Custoworks! Booking ${ref} is now completed. We hope to see you again.`,
    ],
  };
  return map[type];
}

function wrapHtml(title: string, body: string, company: { name: string; phone: string; location: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table width="560" style="background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#0b1f4b;color:#fff;padding:20px 24px;font-size:18px;font-weight:700;letter-spacing:1px">${company.name}</td></tr>
    <tr><td style="padding:24px"><h2 style="margin:0 0 12px;color:#0b1f4b;font-size:18px">${title}</h2>
      <p style="color:#333;line-height:1.6;font-size:14px">${body}</p>
      <p style="margin-top:24px"><a href="${env.CLIENT_URL}/dashboard" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">View my booking</a></p>
    </td></tr>
    <tr><td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px">${company.location} · ${company.phone}</td></tr>
  </table></td></tr></table></body></html>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates in-app + e-mail notifications for a booking event and sends the
 * e-mail asynchronously. Never throws (notifications must not break the flow).
 */
export async function notifyBooking(type: NotificationType, bookingId: string, extra: Record<string, string | undefined> = {}) {
  try {
    const b = await loadBooking(bookingId);
    if (!b) return;
    const settings = await getSettings();
    const [subject, body] = templates(type, b, extra);

    await prisma.notification.create({
      data: { userId: b.customerId, bookingId, channel: 'IN_APP', type, subject, body, status: 'SENT', sentAt: new Date() },
    });
    const email = await prisma.notification.create({
      data: { userId: b.customerId, bookingId, channel: 'EMAIL', type, subject, body, recipient: b.customerEmail },
    });
    sendEmail(b.customerEmail, subject, wrapHtml(subject, body, settings.company), body)
      .then(() => prisma.notification.update({ where: { id: email.id }, data: { status: 'SENT', sentAt: new Date() } }))
      .catch((e) =>
        prisma.notification.update({ where: { id: email.id }, data: { status: 'FAILED', error: String(e?.message ?? e) } }),
      );
  } catch (e) {
    console.error('[notify] failed', type, bookingId, e);
  }
}

/** Alert the business owner (new bookings, new payment proofs, new documents, requests). */
export async function notifyAdmin(subject: string, body: string) {
  try {
    const settings = await getSettings();
    if (env.ADMIN_NOTIFY_EMAIL) {
      await sendEmail(env.ADMIN_NOTIFY_EMAIL, `[Admin] ${subject}`, wrapHtml(subject, body, settings.company), body);
    }
    const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'STAFF'] }, isActive: true }, select: { id: true } });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          channel: 'IN_APP' as const,
          type: 'ADMIN_ALERT',
          subject,
          body,
          status: 'SENT' as const,
          sentAt: new Date(),
        })),
      });
    }
  } catch (e) {
    console.error('[notifyAdmin] failed', e);
  }
}

