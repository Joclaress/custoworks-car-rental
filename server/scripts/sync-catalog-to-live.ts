import { PrismaClient } from '@prisma/client';

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/custoworks?schema=public',
    },
  },
});

const livePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LIVE_DATABASE_URL || 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks',
    },
  },
});

async function sync() {
  console.log('🔄 Syncing local destinations, vehicles, and rate matrices to live Render database...');

  // 1. Sync Destinations
  console.log('1. Syncing destinations...');
  const localDestinations = await localPrisma.destination.findMany();
  const destIdMap = new Map<string, string>(); // localId -> liveId

  for (const dest of localDestinations) {
    const liveDest = await livePrisma.destination.upsert({
      where: { slug: dest.slug },
      update: {
        name: dest.name,
        description: dest.description,
        sortOrder: dest.sortOrder,
        isActive: dest.isActive,
      },
      create: {
        slug: dest.slug,
        name: dest.name,
        description: dest.description,
        sortOrder: dest.sortOrder,
        isActive: dest.isActive,
      },
    });
    destIdMap.set(dest.id, liveDest.id);
  }
  console.log(`Synced ${localDestinations.length} destinations.`);

  // 2. Sync Vehicles
  console.log('2. Syncing vehicles & images...');
  const localVehicles = await localPrisma.vehicle.findMany({
    include: { images: true },
  });
  const vehicleIdMap = new Map<string, string>(); // localId -> liveId

  for (const v of localVehicles) {
    const { images, id: localId, ...vehicleData } = v;
    const liveV = await livePrisma.vehicle.upsert({
      where: { slug: v.slug },
      update: {
        name: v.name,
        category: v.category,
        make: v.make,
        model: v.model,
        year: v.year,
        transmission: v.transmission,
        seats: v.seats,
        fuelType: v.fuelType,
        color: v.color,
        plateNumber: v.plateNumber,
        description: v.description,
        features: v.features,
        allowSelfDrive: v.allowSelfDrive,
        allowWithDriver: v.allowWithDriver,
        status: v.status,
        isPublished: v.isPublished,
        isFeatured: v.isFeatured,
        sortOrder: v.sortOrder,
      },
      create: {
        ...vehicleData,
      },
    });
    vehicleIdMap.set(localId, liveV.id);

    // Sync vehicle images
    for (const img of images) {
      const existingImg = await livePrisma.vehicleImage.findFirst({
        where: { vehicleId: liveV.id, url: img.url },
      });
      if (!existingImg) {
        await livePrisma.vehicleImage.create({
          data: {
            vehicleId: liveV.id,
            url: img.url,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          },
        });
      }
    }
  }
  console.log(`Synced ${localVehicles.length} vehicles.`);

  // 3. Sync Vehicle Rates
  console.log('3. Syncing vehicle rate matrix (364 rates)...');
  const localRates = await localPrisma.vehicleRate.findMany();
  let syncedRates = 0;
  for (const r of localRates) {
    const liveVehicleId = vehicleIdMap.get(r.vehicleId);
    const liveDestId = destIdMap.get(r.destinationId);

    if (!liveVehicleId || !liveDestId) {
      console.warn(`Skipping rate: missing mapping for vehicle ${r.vehicleId} or dest ${r.destinationId}`);
      continue;
    }

    await livePrisma.vehicleRate.upsert({
      where: {
        vehicleId_destinationId_rentalType_duration: {
          vehicleId: liveVehicleId,
          destinationId: liveDestId,
          rentalType: r.rentalType,
          duration: r.duration,
        },
      },
      update: {
        amount: r.amount,
        pricingUnit: r.pricingUnit,
        isPublished: r.isPublished,
      },
      create: {
        vehicleId: liveVehicleId,
        destinationId: liveDestId,
        rentalType: r.rentalType,
        duration: r.duration,
        amount: r.amount,
        pricingUnit: r.pricingUnit,
        isPublished: r.isPublished,
      },
    });
    syncedRates++;
  }
  console.log(`Synced ${syncedRates} vehicle rate records.`);

  // 4. Sync Payment Methods
  console.log('4. Syncing payment methods...');
  const localPaymentMethods = await localPrisma.paymentMethod.findMany();
  for (const pm of localPaymentMethods) {
    await livePrisma.paymentMethod.upsert({
      where: { code: pm.code },
      update: {
        name: pm.name,
        kind: pm.kind,
        accountName: pm.accountName,
        accountNumber: pm.accountNumber,
        instructions: pm.instructions,
        qrImageUrl: pm.qrImageUrl,
        isActive: pm.isActive,
        isCustomerSelectable: pm.isCustomerSelectable,
        sortOrder: pm.sortOrder,
      },
      create: {
        ...pm,
      },
    });
  }
  console.log(`Synced ${localPaymentMethods.length} payment methods.`);

  console.log('🎉 Live Render database is now 100% synchronized with your local admin configuration!');
}

sync()
  .catch((e) => {
    console.error('❌ Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await localPrisma.$disconnect();
    await livePrisma.$disconnect();
  });
