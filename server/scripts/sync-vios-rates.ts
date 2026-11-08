import { PrismaClient, RentalType, RateDuration, PricingUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Synchronizing Toyota Vios 2025 AT rates to match official Sedan rate guide...');

  const vios = await prisma.vehicle.findFirst({
    where: { slug: 'toyota-vios-2025-at' },
  });

  if (!vios) {
    console.error('Toyota Vios 2025 AT not found');
    return;
  }

  const destinations = await prisma.destination.findMany();
  const destMap = new Map(destinations.map((d) => [d.slug, d.id]));

  const sedanRates = [
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 1200 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 1800 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 1600 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 1400 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 2000 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 2600 },

    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 1500 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2000 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 1800 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 2300 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 2800 },

    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 1800 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2300 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2000 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 2600 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 3200 },

    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2600 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2300 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 3500 },

    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3200 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4500 },
  ];

  for (const r of sedanRates) {
    const destId = destMap.get(r.dest);
    if (!destId) continue;

    await prisma.vehicleRate.upsert({
      where: {
        vehicleId_destinationId_rentalType_duration: {
          vehicleId: vios.id,
          destinationId: destId,
          rentalType: r.type,
          duration: r.dur,
        },
      },
      update: {
        amount: r.amt,
        isPublished: true,
        pricingUnit: PricingUnit.PER_DAY,
      },
      create: {
        vehicleId: vios.id,
        destinationId: destId,
        rentalType: r.type,
        duration: r.dur,
        pricingUnit: PricingUnit.PER_DAY,
        amount: r.amt,
        isPublished: true,
      },
    });
  }

  console.log('✅ Toyota Vios rates successfully updated to 1,200 (12h) and 1,800 (24h) in Naga City!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
