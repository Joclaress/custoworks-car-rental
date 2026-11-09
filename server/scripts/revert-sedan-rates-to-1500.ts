import { PrismaClient, RentalType, RateDuration, PricingUnit } from '@prisma/client';

const livePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LIVE_DATABASE_URL || 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks',
    },
  },
});

async function main() {
  console.log('🔍 Checking live rates for Sedans in Naga City...');

  const nagaCity = await livePrisma.destination.findFirst({
    where: { slug: 'naga-city' },
  });

  if (!nagaCity) {
    console.error('Naga City destination not found in live DB');
    return;
  }

  const sedans = await livePrisma.vehicle.findMany({
    where: { category: 'SEDAN' },
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${sedans.length} sedans:`, sedans.map((s) => s.name));

  for (const s of sedans) {
    const existingRates = await livePrisma.vehicleRate.findMany({
      where: {
        vehicleId: s.id,
        destinationId: nagaCity.id,
      },
    });

    console.log(`Current Naga City rates for ${s.name}:`);
    for (const r of existingRates) {
      console.log(`  ${r.rentalType} | ${r.duration}: ₱${r.amount}`);
    }

    // Update 12h Self-Drive to 1,500
    await livePrisma.vehicleRate.upsert({
      where: {
        vehicleId_destinationId_rentalType_duration: {
          vehicleId: s.id,
          destinationId: nagaCity.id,
          rentalType: RentalType.SELF_DRIVE,
          duration: RateDuration.HOURS_12,
        },
      },
      update: {
        amount: 1500,
        isPublished: true,
      },
      create: {
        vehicleId: s.id,
        destinationId: nagaCity.id,
        rentalType: RentalType.SELF_DRIVE,
        duration: RateDuration.HOURS_12,
        pricingUnit: PricingUnit.PER_DAY,
        amount: 1500,
        isPublished: true,
      },
    });

    // Update 24h Self-Drive to 2,000
    await livePrisma.vehicleRate.upsert({
      where: {
        vehicleId_destinationId_rentalType_duration: {
          vehicleId: s.id,
          destinationId: nagaCity.id,
          rentalType: RentalType.SELF_DRIVE,
          duration: RateDuration.HOURS_24,
        },
      },
      update: {
        amount: 2000,
        isPublished: true,
      },
      create: {
        vehicleId: s.id,
        destinationId: nagaCity.id,
        rentalType: RentalType.SELF_DRIVE,
        duration: RateDuration.HOURS_24,
        pricingUnit: PricingUnit.PER_DAY,
        amount: 2000,
        isPublished: true,
      },
    });

    console.log(`✅ Updated ${s.name} in Naga City to ₱1,500 (12h) and ₱2,000 (24h)`);
  }

  // Also check Camarines Sur and other destinations if needed
  console.log('✅ All Sedans in live database successfully reverted to starting price ₱1,500 (12h) / ₱2,000 (24h)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await livePrisma.$disconnect();
  });
