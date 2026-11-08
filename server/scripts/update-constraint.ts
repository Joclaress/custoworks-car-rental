import { prisma } from '../src/lib/prisma';
import { PrismaClient } from '@prisma/client';

const LIVE_DB_URL = 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks';

async function main() {
  console.log('--- Updating local DB constraint ---');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_no_overlap";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
      EXCLUDE USING gist (
        "vehicle_id" WITH =,
        tstzrange("pickup_at", "return_at", '[)') WITH &&
      ) WHERE ("status" IN ('CONFIRMED', 'ONGOING'));
  `);
  console.log('✅ Local DB constraint updated to CONFIRMED, ONGOING only.');

  console.log('--- Updating live Render DB constraint ---');
  const livePrisma = new PrismaClient({ datasources: { db: { url: LIVE_DB_URL } } });
  await livePrisma.$executeRawUnsafe(`
    ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_no_overlap";
  `);
  await livePrisma.$executeRawUnsafe(`
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
      EXCLUDE USING gist (
        "vehicle_id" WITH =,
        tstzrange("pickup_at", "return_at", '[)') WITH &&
      ) WHERE ("status" IN ('CONFIRMED', 'ONGOING'));
  `);
  console.log('✅ Live Render DB constraint updated to CONFIRMED, ONGOING only.');

  await prisma.$disconnect();
  await livePrisma.$disconnect();
}

main().catch(console.error);
