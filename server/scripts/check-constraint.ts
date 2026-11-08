import { prisma } from '../src/lib/prisma';
import { PrismaClient } from '@prisma/client';

const LIVE_DB_URL = 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks';

async function main() {
  console.log('Checking local constraint...');
  const localRes = await prisma.$queryRawUnsafe(`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conname = 'bookings_no_overlap';
  `);
  console.log('Local DB constraint:', localRes);

  const livePrisma = new PrismaClient({ datasources: { db: { url: LIVE_DB_URL } } });
  console.log('Checking live constraint...');
  const liveRes = await livePrisma.$queryRawUnsafe(`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conname = 'bookings_no_overlap';
  `);
  console.log('Live DB constraint:', liveRes);

  await prisma.$disconnect();
  await livePrisma.$disconnect();
}

main().catch(console.error);
