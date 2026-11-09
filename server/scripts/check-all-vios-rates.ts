import { PrismaClient } from '@prisma/client';

const livePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LIVE_DATABASE_URL || 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks',
    },
  },
});

async function main() {
  const vios = await livePrisma.vehicle.findFirst({
    where: { slug: 'toyota-vios-2025-at' },
  });
  if (!vios) return;

  const rates = await livePrisma.vehicleRate.findMany({
    where: { vehicleId: vios.id, isPublished: true },
    include: { destination: true },
  });

  console.log(`All rates for Vios (${rates.length}):`);
  for (const r of rates) {
    console.log(`Dest: ${r.destination.name} (${r.destination.slug}) | ${r.rentalType} | ${r.duration}: ₱${r.amount}`);
  }
}

main().finally(() => livePrisma.$disconnect());
