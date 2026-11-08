import { PrismaClient, RentalType, RateDuration, PricingUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Importing official Custoworks rate matrices from images...');

  const destinations = await prisma.destination.findMany({ where: { deletedAt: null } });
  const destMap = new Map(destinations.map((d) => [d.slug, d.id]));

  // Ensure Nissan NV350 allows both Self-Drive and With-Driver as shown on the rate sheet
  await prisma.vehicle.updateMany({
    where: { slug: 'nissan-nv350-urvan-mt' },
    data: { allowSelfDrive: true, allowWithDriver: true },
  });

  // 1. SEDAN RATES (Mirage G4 & Toyota Vios)
  const sedanRates = [
    // Naga City
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 1500 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2000 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 1900 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 35000, unit: PricingUnit.FLAT },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 2800 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 3800 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 3700 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 3600 },

    // Camarines Sur
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 1700 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2200 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2100 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 35000, unit: PricingUnit.FLAT },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3000 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4000 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 3900 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 4100 },

    // Albay / Daet
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2000 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2500 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2400 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 35000, unit: PricingUnit.FLAT },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3300 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4300 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 4200 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 4600 },

    // Sorsogon / Labo
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2500 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3000 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2900 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 35000, unit: PricingUnit.FLAT },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3800 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4800 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 4700 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 4600 },

    // Manila
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 4500 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 5000 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 4900 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 45000, unit: PricingUnit.FLAT },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 5800 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 6800 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 6700 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 6600 },
  ];

  // 2. XPANDER AT RATES
  const xpanderRates = [
    // Naga City
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2000 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2500 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2400 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 45000, unit: PricingUnit.FLAT },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3300 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4300 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 4200 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 4100 },

    // Camarines Sur
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2200 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2700 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2600 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 45000, unit: PricingUnit.FLAT },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3500 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4500 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 4400 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 4300 },

    // Albay / Daet
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2500 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3000 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2900 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 45000, unit: PricingUnit.FLAT },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3800 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4800 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 4700 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 4600 },

    // Sorsogon / Labo
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 3000 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3500 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 3400 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 45000, unit: PricingUnit.FLAT },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 4300 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 5300 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 5200 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 5100 },

    // Manila
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 5500 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 6000 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 5900 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 60000, unit: PricingUnit.FLAT },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 6800 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 7800 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 7700 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 7600 },
  ];

  // 3. INNOVA AT RATES
  const innovaRates = [
    // Naga City
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2500 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3000 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 2900 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 50000, unit: PricingUnit.FLAT },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3800 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4800 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 4700 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 4600 },

    // Camarines Sur
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2700 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3200 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 3100 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 50000, unit: PricingUnit.FLAT },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 4300 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 5300 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 5200 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 5100 },

    // Albay / Daet
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 3000 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3500 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 3400 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 50000, unit: PricingUnit.FLAT },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 4800 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 5800 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 5700 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 5600 },

    // Sorsogon / Labo
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 3500 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 4000 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 3900 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 50000, unit: PricingUnit.FLAT },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 5300 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 6300 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 6200 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 6100 },

    // Manila
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 6500 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 7000 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 6400 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 70000, unit: PricingUnit.FLAT },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 7800 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 8800 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 8700 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 8600 },
  ];

  // 4. VAN NV350 RATES
  const vanRates = [
    // Naga City
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 4000 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 5000 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 4900 },
    { dest: 'naga-city', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 4800 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 5500 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 7000 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 6900 },
    { dest: 'naga-city', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 6800 },

    // Camarines Sur
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 4500 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 5500 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 5400 },
    { dest: 'camarines-sur', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 5300 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 6000 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 7500 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 7400 },
    { dest: 'camarines-sur', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 7300 },

    // Albay / Daet
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 5000 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 6000 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 5900 },
    { dest: 'albay-daet', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 5800 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 6500 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 8000 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 7900 },
    { dest: 'albay-daet', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 7800 },

    // Sorsogon / Labo
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 5500 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 6500 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 6400 },
    { dest: 'sorsogon-labo', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 6300 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 7000 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 8500 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 8400 },
    { dest: 'sorsogon-labo', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 8300 },

    // Manila
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 7000 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 7500 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 7400 },
    { dest: 'manila', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 7300 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 9000 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 9500 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 9400 },
    { dest: 'manila', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 9300 },

    // Baguio
    { dest: 'baguio', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 8000 },
    { dest: 'baguio', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 8500 },
    { dest: 'baguio', type: RentalType.SELF_DRIVE, dur: RateDuration.WEEKLY, amt: 8400 },
    { dest: 'baguio', type: RentalType.SELF_DRIVE, dur: RateDuration.MONTHLY, amt: 8300 },
    { dest: 'baguio', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 10000 },
    { dest: 'baguio', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 10500 },
    { dest: 'baguio', type: RentalType.WITH_DRIVER, dur: RateDuration.WEEKLY, amt: 10400 },
    { dest: 'baguio', type: RentalType.WITH_DRIVER, dur: RateDuration.MONTHLY, amt: 10300 },
  ];

  async function applyRateArray(vehicleSlug: string, rates: any[]) {
    const vehicle = await prisma.vehicle.findFirst({ where: { slug: vehicleSlug } });
    if (!vehicle) {
      console.warn(`Vehicle with slug ${vehicleSlug} not found`);
      return;
    }

    for (const r of rates) {
      const destId = destMap.get(r.dest);
      if (!destId) continue;

      await prisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId: vehicle.id,
            destinationId: destId,
            rentalType: r.type,
            duration: r.dur,
          },
        },
        update: {
          amount: r.amt,
          isPublished: true,
          pricingUnit: r.unit || PricingUnit.PER_DAY,
        },
        create: {
          vehicleId: vehicle.id,
          destinationId: destId,
          rentalType: r.type,
          duration: r.dur,
          pricingUnit: r.unit || PricingUnit.PER_DAY,
          amount: r.amt,
          isPublished: true,
        },
      });
    }
    console.log(`✅ Applied ${rates.length} rates for ${vehicle.name}`);
  }

  // Apply to all published models
  await applyRateArray('toyota-vios-2025-at', sedanRates);
  await applyRateArray('mitsubishi-mirage-g4-at', sedanRates);
  await applyRateArray('mitsubishi-xpander-at', xpanderRates);
  await applyRateArray('toyota-innova-at', innovaRates);
  await applyRateArray('nissan-nv350-urvan-mt', vanRates);

  console.log('🎉 All 4 official rate sheets successfully imported and published into the database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
