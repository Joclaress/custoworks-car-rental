import { PrismaClient, RentalType, RateDuration, PricingUnit } from '@prisma/client';

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/custoworks?schema=public',
    },
  },
});

async function main() {
  try {
    const nagaCity = await localPrisma.destination.findFirst({
      where: { slug: 'naga-city' },
    });

    if (!nagaCity) return;

    const sedans = await localPrisma.vehicle.findMany({
      where: { category: 'SEDAN' },
    });

    for (const s of sedans) {
      await localPrisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: s.id,
            destinationId: nagaCity.id,
            rentalType: RentalType.SELF_DRIVE,
            duration: RateDuration.HOURS_12,
          },
        },
        update: { amount: 1500, isPublished: true },
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

      await localPrisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: s.id,
            destinationId: nagaCity.id,
            rentalType: RentalType.SELF_DRIVE,
            duration: RateDuration.HOURS_24,
          },
        },
        update: { amount: 2000, isPublished: true },
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
    }
    console.log('✅ Local database sedans also updated to 1500 / 2000.');
  } catch (e) {
    console.log('Local DB skipped or not running:', (e as any).message);
  } finally {
    await localPrisma.$disconnect();
  }
}

main();
