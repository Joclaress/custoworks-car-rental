import { PrismaClient } from '@prisma/client';

const livePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LIVE_DATABASE_URL || 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks',
    },
  },
});

async function main() {
  const vios = await livePrisma.vehicle.findFirst({ where: { slug: 'toyota-vios-2025-at' } });
  if (!vios) return;

  const dests = await livePrisma.destination.findMany();
  console.log('All destinations:');
  for (const d of dests) {
    console.log(`  id: ${d.id} | slug: ${d.slug} | name: ${d.name}`);
  }

  const nagaRates = await livePrisma.vehicleRate.findMany({
    where: {
      vehicleId: vios.id,
      destination: { slug: 'naga-city' },
    },
  });

  console.log(`Naga City rates for Vios count: ${nagaRates.length}`);
  for (const r of nagaRates) {
    console.log(`  id: ${r.id} | destId: ${r.destinationId} | ${r.rentalType} | ${r.duration}: ₱${r.amount}`);
  }

  // Force direct update by ID!
  console.log('Now directly updating all Naga City rates for all sedans by ID...');
  const sedans = await livePrisma.vehicle.findMany({ where: { category: 'SEDAN' } });

  for (const s of sedans) {
    const sRates = await livePrisma.vehicleRate.findMany({
      where: {
        vehicleId: s.id,
        destination: { slug: 'naga-city' },
      },
    });

    for (const r of sRates) {
      if (r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_12') {
        await livePrisma.vehicleRate.update({
          where: { id: r.id },
          data: { amount: 1500 },
        });
        console.log(`Updated ${s.name} ${r.id} to 1500`);
      }
      if (r.rentalType === 'SELF_DRIVE' && r.duration === 'HOURS_24') {
        await livePrisma.vehicleRate.update({
          where: { id: r.id },
          data: { amount: 2000 },
        });
        console.log(`Updated ${s.name} ${r.id} to 2000`);
      }
      if (r.rentalType === 'WITH_DRIVER' && r.duration === 'HOURS_12') {
        await livePrisma.vehicleRate.update({
          where: { id: r.id },
          data: { amount: 2800 },
        });
        console.log(`Updated ${s.name} ${r.id} to 2800`);
      }
      if (r.rentalType === 'WITH_DRIVER' && r.duration === 'HOURS_24') {
        await livePrisma.vehicleRate.update({
          where: { id: r.id },
          data: { amount: 3800 },
        });
        console.log(`Updated ${s.name} ${r.id} to 3800`);
      }
    }
  }

  console.log('Verification completed.');
}

main().finally(() => livePrisma.$disconnect());
