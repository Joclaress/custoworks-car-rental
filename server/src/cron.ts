import cron from 'node-cron';
import { prisma } from './lib/prisma';
import { expireStaleHolds } from './services/availability.service';
import { notifyBooking } from './services/notification.service';
import { getSettings } from './services/settings.service';

export function startBackgroundJobs() {
  // 1. Release expired holds every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      const expired = await expireStaleHolds(prisma);
      if (expired.length > 0) {
        console.log(`[cron] Expired ${expired.length} stale booking hold(s).`);
        for (const item of expired) {
          await notifyBooking('BOOKING_EXPIRED', item.id);
        }
      }
    } catch (e) {
      console.error('[cron] Error expiring stale holds:', e);
    }
  });

  // 2. Send 24-hour pick-up reminders every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const settings = await getSettings();
      const hours = settings.booking.reminderHoursBefore || 24;
      const targetTime = new Date(Date.now() + hours * 3_600_000);
      const windowStart = new Date(targetTime.getTime() - 30 * 60_000);
      const windowEnd = new Date(targetTime.getTime() + 30 * 60_000);

      const dueBookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          reminderSentAt: null,
          pickupAt: { gte: windowStart, lte: windowEnd },
        },
      });

      for (const b of dueBookings) {
        await notifyBooking('PICKUP_REMINDER', b.id);
        await prisma.booking.update({
          where: { id: b.id },
          data: { reminderSentAt: new Date() },
        });
      }
    } catch (e) {
      console.error('[cron] Error sending pickup reminders:', e);
    }
  });

  console.log('⏰ Background cron jobs started (stale hold reaper & pickup reminders)');
}

