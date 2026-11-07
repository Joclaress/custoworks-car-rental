import { PrismaClient, VehicleCategory, Transmission, VehicleStatus, RentalType, RateDuration, PricingUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚗 Setting up 5 Mirage units (3 Available, max 5)...');

  // Sedan rates to copy to all Mirage units
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

  const destinations = await prisma.destination.findMany();
  const destMap = new Map(destinations.map((d) => [d.slug, d.id]));

  const mirageUnits = [
    {
      slug: 'mitsubishi-mirage-g4-at',
      name: 'Mitsubishi Mirage G4 AT (Unit 1)',
      color: 'Cool Silver Metallic',
      plateNumber: 'MIR-4421',
      status: VehicleStatus.AVAILABLE,
      sortOrder: 2,
    },
    {
      slug: 'mitsubishi-mirage-g4-unit-2',
      name: 'Mitsubishi Mirage G4 AT (Unit 2)',
      color: 'Cool Silver Metallic',
      plateNumber: 'MIR-8832',
      status: VehicleStatus.AVAILABLE,
      sortOrder: 3,
    },
    {
      slug: 'mitsubishi-mirage-g4-unit-3',
      name: 'Mitsubishi Mirage G4 AT (Unit 3)',
      color: 'Cool Silver Metallic',
      plateNumber: 'MIR-1904',
      status: VehicleStatus.AVAILABLE,
      sortOrder: 4,
    },
    {
      slug: 'mitsubishi-mirage-g4-unit-4',
      name: 'Mitsubishi Mirage G4 AT (Unit 4)',
      color: 'Cool Silver Metallic',
      plateNumber: 'MIR-5567',
      status: VehicleStatus.MAINTENANCE,
      sortOrder: 5,
    },
    {
      slug: 'mitsubishi-mirage-g4-unit-5',
      name: 'Mitsubishi Mirage G4 AT (Unit 5)',
      color: 'Cool Silver Metallic',
      plateNumber: 'MIR-9213',
      status: VehicleStatus.UNAVAILABLE,
      sortOrder: 6,
    },
  ];

  for (const u of mirageUnits) {
    const vehicle = await prisma.vehicle.upsert({
      where: { slug: u.slug },
      update: {
        name: u.name,
        color: u.color,
        plateNumber: u.plateNumber,
        status: u.status,
        sortOrder: u.sortOrder,
        allowSelfDrive: true,
        allowWithDriver: true,
        isPublished: true,
      },
      create: {
        slug: u.slug,
        name: u.name,
        category: VehicleCategory.SEDAN,
        make: 'Mitsubishi',
        model: 'Mirage G4',
        year: 2024,
        transmission: Transmission.AT,
        seats: 5,
        fuelType: 'Gasoline',
        color: u.color,
        plateNumber: u.plateNumber,
        description: 'Zippy and economical Mitsubishi Mirage G4 sedan with CVT. Spacious legroom and trunk, easy city driving and highway cruising across Bicol.',
        features: ['Automatic CVT', 'Spacious Trunk', 'Cold Air Conditioning', 'Eco-Drive Indicator', 'Keyless Entry', 'Bluetooth Stereo'],
        allowSelfDrive: true,
        allowWithDriver: true,
        status: u.status,
        isPublished: true,
        isFeatured: true,
        sortOrder: u.sortOrder,
      },
    });

    // Ensure image exists
    const existingImg = await prisma.vehicleImage.findFirst({
      where: { vehicleId: vehicle.id },
    });
    if (!existingImg) {
      await prisma.vehicleImage.create({
        data: {
          vehicleId: vehicle.id,
          url: '/images/vehicle-mirage.jpg',
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    // Apply rates
    for (const r of sedanRates) {
      const destinationId = destMap.get(r.dest);
      if (!destinationId) continue;
      await prisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: vehicle.id,
            destinationId,
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
          vehicleId: vehicle.id,
          destinationId,
          rentalType: r.type,
          duration: r.dur,
          amount: r.amt,
          isPublished: true,
          pricingUnit: PricingUnit.PER_DAY,
        },
      });
    }
  }

  // Count current Mirage fleet
  const countTotal = await prisma.vehicle.count({
    where: { model: 'Mirage G4', deletedAt: null },
  });
  const countAvailable = await prisma.vehicle.count({
    where: { model: 'Mirage G4', status: VehicleStatus.AVAILABLE, deletedAt: null },
  });

  console.log(`✅ Finished: Mirage fleet now has ${countTotal} units in total (${countAvailable} AVAILABLE).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

