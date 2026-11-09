import { PrismaClient } from '@prisma/client';

const p = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LIVE_DATABASE_URL || 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks',
    },
  },
});

async function main() {
  const rates = await p.vehicleRate.findMany({
    where: {
      vehicle: { category: 'SEDAN' },
    },
    include: { destination: true, vehicle: true },
  });

  const low = rates.filter((r) => Number(r.amount) < 2000);
  console.log('Low sedan rates:');
  for (const r of low) {
    console.log(`${r.vehicle.name} | ${r.destination.slug} | ${r.rentalType} | ${r.duration}: ₱${r.amount}`);
  }
}

main().finally(() => p.$disconnect());
