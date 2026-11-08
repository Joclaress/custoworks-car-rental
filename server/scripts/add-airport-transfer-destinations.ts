import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- ADDING AIRPORT TRANSFER DESTINATIONS & RATES ---');

  // 1. Destination: Bicol International Airport (BIA / Daraga)
  const biaDest = await prisma.destination.upsert({
    where: { slug: 'bicol-intl-airport' },
    update: {
      name: 'Bicol International Airport (BIA / Daraga) - Pickup & Drop',
      description: 'Official Naga City to Bicol International Airport (Daraga) Airport Chauffeur Meetup & Drop-off (95 km)',
      sortOrder: 3,
      isActive: true,
      deletedAt: null,
    },
    create: {
      slug: 'bicol-intl-airport',
      name: 'Bicol International Airport (BIA / Daraga) - Pickup & Drop',
      description: 'Official Naga City to Bicol International Airport (Daraga) Airport Chauffeur Meetup & Drop-off (95 km)',
      sortOrder: 3,
      isActive: true,
    },
  });
  console.log(`BIA Destination created/updated: ${biaDest.id} (${biaDest.name})`);

  // 2. Destination: Naga Airport (WNP / Pili)
  const nagaAirportDest = await prisma.destination.upsert({
    where: { slug: 'naga-airport' },
    update: {
      name: 'Naga Airport (WNP / Pili) - Pickup & Drop',
      description: 'Local Naga / Pili Airport terminal pickup, drop-off & flight arrival shuttle (15 km)',
      sortOrder: 2,
      isActive: true,
      deletedAt: null,
    },
    create: {
      slug: 'naga-airport',
      name: 'Naga Airport (WNP / Pili) - Pickup & Drop',
      description: 'Local Naga / Pili Airport terminal pickup, drop-off & flight arrival shuttle (15 km)',
      sortOrder: 2,
      isActive: true,
    },
  });
  console.log(`Naga Airport Destination created/updated: ${nagaAirportDest.id} (${nagaAirportDest.name})`);

  // Retrieve all vehicles
  const vehicles = await prisma.vehicle.findMany({ where: { deletedAt: null } });

  // Rate plans to insert
  const durations = ['HOURS_12', 'HOURS_24'] as const;

  for (const v of vehicles) {
    const isVan = v.category === 'VAN';
    const isMPV = v.category === 'SUV_MPV';
    const isSedan = v.category === 'SEDAN';

    // BIA Rates
    // Van: 7500, MPV/Innova: 6000, Sedan: 4500
    const biaDriverRate = isVan ? 7500 : isMPV ? 6000 : 4500;
    const biaSelfRate12 = isVan ? 5000 : isMPV ? 3000 : 2000;
    const biaSelfRate24 = isVan ? 6000 : isMPV ? 3500 : 2500;

    // Naga Airport Rates
    // Van: 3500, MPV/Innova: 2500, Sedan: 1800
    const nagaDriverRate = isVan ? 3500 : isMPV ? 2500 : 1800;
    const nagaSelfRate12 = isVan ? 4000 : isMPV ? 2000 : 1500;
    const nagaSelfRate24 = isVan ? 5000 : isMPV ? 2500 : 2000;

    // Upsert BIA With Driver Rates
    for (const dur of durations) {
      await prisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: v.id,
            destinationId: biaDest.id,
            rentalType: 'WITH_DRIVER',
            duration: dur,
          },
        },
        update: {
          amount: biaDriverRate,
          isPublished: true,
          pricingUnit: 'FLAT',
        },
        create: {
          vehicleId: v.id,
          destinationId: biaDest.id,
          rentalType: 'WITH_DRIVER',
          duration: dur,
          amount: biaDriverRate,
          pricingUnit: 'FLAT',
          isPublished: true,
        },
      });

      // Upsert BIA Self Drive Rates
      await prisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: v.id,
            destinationId: biaDest.id,
            rentalType: 'SELF_DRIVE',
            duration: dur,
          },
        },
        update: {
          amount: dur === 'HOURS_12' ? biaSelfRate12 : biaSelfRate24,
          isPublished: true,
          pricingUnit: 'FLAT',
        },
        create: {
          vehicleId: v.id,
          destinationId: biaDest.id,
          rentalType: 'SELF_DRIVE',
          duration: dur,
          amount: dur === 'HOURS_12' ? biaSelfRate12 : biaSelfRate24,
          pricingUnit: 'FLAT',
          isPublished: true,
        },
      });

      // Upsert Naga Airport With Driver Rates
      await prisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: v.id,
            destinationId: nagaAirportDest.id,
            rentalType: 'WITH_DRIVER',
            duration: dur,
          },
        },
        update: {
          amount: nagaDriverRate,
          isPublished: true,
          pricingUnit: 'FLAT',
        },
        create: {
          vehicleId: v.id,
          destinationId: nagaAirportDest.id,
          rentalType: 'WITH_DRIVER',
          duration: dur,
          amount: nagaDriverRate,
          pricingUnit: 'FLAT',
          isPublished: true,
        },
      });

      // Upsert Naga Airport Self Drive Rates
      await prisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: v.id,
            destinationId: nagaAirportDest.id,
            rentalType: 'SELF_DRIVE',
            duration: dur,
          },
        },
        update: {
          amount: dur === 'HOURS_12' ? nagaSelfRate12 : nagaSelfRate24,
          isPublished: true,
          pricingUnit: 'FLAT',
        },
        create: {
          vehicleId: v.id,
          destinationId: nagaAirportDest.id,
          rentalType: 'SELF_DRIVE',
          duration: dur,
          amount: dur === 'HOURS_12' ? nagaSelfRate12 : nagaSelfRate24,
          pricingUnit: 'FLAT',
          isPublished: true,
        },
      });
    }

    console.log(`Rates configured for ${v.name} (${v.category}): BIA Driver = ₱${biaDriverRate}, Naga Airport Driver = ₱${nagaDriverRate}`);
  }

  console.log('--- ALL AIRPORT RATES SUCCESSFULLY SAVED TO DATABASE ---');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
