import { PrismaClient, VehicleCategory, Transmission, VehicleStatus, RentalType, RateDuration, PricingUnit, FeeType } from '@prisma/client';

const livePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LIVE_DATABASE_URL || 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks',
    },
  },
});

export const officialDestinations = [
  { name: 'Naga City', slug: 'naga-city', sortOrder: 1, description: 'Naga City proper, SM City Naga, Magsaysay Ave, Centro' },
  { name: 'Camarines Sur', slug: 'camarines-sur', sortOrder: 2, description: 'Pili, Canaman, Milaor, Magarao, Ocampo, Calabanga, Pasacao, Baao, Iriga' },
  { name: 'Naga Airport (WNP / Pili) - Pickup & Drop', slug: 'naga-airport', sortOrder: 3, description: 'Local Naga / Pili Airport terminal pickup, drop-off & flight arrival shuttle (15 km)' },
  { name: 'Bicol International Airport (BIA / Daraga) - Pickup & Drop', slug: 'bicol-intl-airport', sortOrder: 4, description: 'Official Naga City to Bicol International Airport (Daraga) Airport Chauffeur Meetup & Drop-off (95 km)' },
  { name: 'Albay / Daet', slug: 'albay-daet', sortOrder: 5, description: 'Legazpi, Daraga, Tabaco, Polangui, Ligao, Daet Camarines Norte' },
  { name: 'Sorsogon / Labo', slug: 'sorsogon-labo', sortOrder: 6, description: 'Sorsogon City, Matnog, Donsol, Gubat, Bulan, Labo' },
  { name: 'Manila', slug: 'manila', sortOrder: 7, description: 'Metro Manila, NAIA Terminals 1-4, Quezon City, Makati, BGC, Alabang' },
  { name: 'Baguio', slug: 'baguio', sortOrder: 8, description: 'Baguio City, Benguet, Northern Luzon' },
];

// 1. SEDAN RATES (Toyota Vios & Mitsubishi Mirage G4)
export const officialSedanRates = [
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

  // Naga Airport
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 1500, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2000, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 1800, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 1800, unit: PricingUnit.FLAT },

  // Bicol International Airport
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2000, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2500, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 4500, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 4500, unit: PricingUnit.FLAT },

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
export const officialXpanderRates = [
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

  // Naga Airport
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2000, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2500, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 2500, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 2500, unit: PricingUnit.FLAT },

  // Bicol International Airport
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 3000, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3500, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 6000, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 6000, unit: PricingUnit.FLAT },

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
export const officialInnovaRates = [
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

  // Naga Airport
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 2000, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 2500, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 2500, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 2500, unit: PricingUnit.FLAT },

  // Bicol International Airport
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 3000, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 3500, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 6000, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 6000, unit: PricingUnit.FLAT },

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
export const officialVanRates = [
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

  // Naga Airport
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 4000, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 5000, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 3500, unit: PricingUnit.FLAT },
  { dest: 'naga-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 3500, unit: PricingUnit.FLAT },

  // Bicol International Airport
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_12, amt: 5000, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.SELF_DRIVE, dur: RateDuration.HOURS_24, amt: 6000, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_12, amt: 7500, unit: PricingUnit.FLAT },
  { dest: 'bicol-intl-airport', type: RentalType.WITH_DRIVER, dur: RateDuration.HOURS_24, amt: 7500, unit: PricingUnit.FLAT },

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

async function applyRatesToVehicle(vehicleId: string, vehicleName: string, rates: any[], destMap: Map<string, string>) {
  for (const r of rates) {
    const destId = destMap.get(r.dest);
    if (!destId) continue;

    await livePrisma.vehicleRate.upsert({
      where: {
        vehicleId_destinationId_rentalType_duration: {
          vehicleId,
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
        vehicleId,
        destinationId: destId,
        rentalType: r.type,
        duration: r.dur,
        pricingUnit: r.unit || PricingUnit.PER_DAY,
        amount: r.amt,
        isPublished: true,
      },
    });
  }
  console.log(`✅ Applied ${rates.length} rates for ${vehicleName}`);
}

async function main() {
  console.log('🚀 Synchronizing complete official rate cards to live Render database...');

  // 1. Ensure all destinations exist
  for (const d of officialDestinations) {
    await livePrisma.destination.upsert({
      where: { slug: d.slug },
      update: { name: d.name, sortOrder: d.sortOrder, description: d.description, isActive: true, deletedAt: null },
      create: { slug: d.slug, name: d.name, sortOrder: d.sortOrder, description: d.description, isActive: true },
    });
  }
  const destinations = await livePrisma.destination.findMany({ where: { deletedAt: null } });
  const destMap = new Map(destinations.map((d) => [d.slug, d.id]));

  // 2. Ensure Nissan NV350 has allowSelfDrive: true
  await livePrisma.vehicle.updateMany({
    where: { slug: 'nissan-nv350-urvan-mt' },
    data: { allowSelfDrive: true, allowWithDriver: true },
  });

  // 3. Apply Sedan rates to Vios and ALL Mirage units
  const vios = await livePrisma.vehicle.findFirst({ where: { slug: 'toyota-vios-2025-at' } });
  if (vios) await applyRatesToVehicle(vios.id, vios.name, officialSedanRates, destMap);

  const mirages = await livePrisma.vehicle.findMany({ where: { slug: { startsWith: 'mitsubishi-mirage' } } });
  for (const m of mirages) {
    await applyRatesToVehicle(m.id, m.name, officialSedanRates, destMap);
  }

  // 4. Apply Xpander rates
  const xpander = await livePrisma.vehicle.findFirst({ where: { slug: 'mitsubishi-xpander-at' } });
  if (xpander) await applyRatesToVehicle(xpander.id, xpander.name, officialXpanderRates, destMap);

  // 5. Apply Innova rates
  const innova = await livePrisma.vehicle.findFirst({ where: { slug: 'toyota-innova-at' } });
  if (innova) await applyRatesToVehicle(innova.id, innova.name, officialInnovaRates, destMap);

  // 6. Apply Van rates
  const van = await livePrisma.vehicle.findFirst({ where: { slug: 'nissan-nv350-urvan-mt' } });
  if (van) await applyRatesToVehicle(van.id, van.name, officialVanRates, destMap);

  console.log('🎉 Live database completely synchronized with official rate sheets!');
}

main()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(() => livePrisma.$disconnect());
