import { PrismaClient, VehicleCategory, Transmission, RentalType, RateDuration, PricingUnit, RequirementAppliesTo, PaymentMethodKind, FeeType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Custoworks Car Rental database...');

  // 1. Admin & Staff Users
  const adminPasswordHash = await bcrypt.hash('ChangeMe!2026', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'custoworks1@gmail.com' },
    update: {},
    create: {
      email: 'custoworks1@gmail.com',
      fullName: 'Custoworks Administrator',
      phone: '0961 722 5326',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      profile: {
        create: {
          address: 'Naga City, Camarines Sur',
          city: 'Naga City',
          province: 'Camarines Sur',
        },
      },
    },
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: 'customer@custoworks.ph' },
    update: {},
    create: {
      email: 'customer@custoworks.ph',
      fullName: 'Juan Dela Cruz',
      phone: '0917 123 4567',
      passwordHash: adminPasswordHash,
      role: 'CUSTOMER',
      profile: {
        create: {
          address: 'Magsaysay Ave, Naga City',
          city: 'Naga City',
          province: 'Camarines Sur',
          emergencyContactName: 'Maria Dela Cruz',
          emergencyContactPhone: '0918 765 4321',
          emergencyContactRelation: 'Spouse',
        },
      },
    },
  });

  console.log('👤 Users created: admin@custoworks.ph, customer@custoworks.ph');

  // 2. Destinations from Custoworks Rate Cards
  const destinationsData = [
    { name: 'Naga City', slug: 'naga-city', sortOrder: 1, description: 'Naga City proper, SM City Naga, Magsaysay Ave, Centro' },
    { name: 'Camarines Sur', slug: 'camarines-sur', sortOrder: 2, description: 'Pili, Canaman, Milaor, Magarao, Ocampo, Calabanga, Pasacao, Baao, Iriga' },
    { name: 'Naga Airport (WNP / Pili) - Pickup & Drop', slug: 'naga-airport', sortOrder: 3, description: 'Local Naga / Pili Airport terminal pickup, drop-off & flight arrival shuttle (15 km)' },
    { name: 'Bicol International Airport (BIA / Daraga) - Pickup & Drop', slug: 'bicol-intl-airport', sortOrder: 4, description: 'Official Naga City to Bicol International Airport (Daraga) Airport Chauffeur Meetup & Drop-off (95 km)' },
    { name: 'Albay / Daet', slug: 'albay-daet', sortOrder: 5, description: 'Legazpi, Daraga, Tabaco, Polangui, Ligao, Daet Camarines Norte' },
    { name: 'Sorsogon / Labo', slug: 'sorsogon-labo', sortOrder: 6, description: 'Sorsogon City, Matnog, Donsol, Gubat, Bulan, Labo' },
    { name: 'Manila', slug: 'manila', sortOrder: 7, description: 'Metro Manila, NAIA Terminals 1-4, Quezon City, Makati, BGC, Alabang' },
    { name: 'Baguio', slug: 'baguio', sortOrder: 8, description: 'Baguio City, Benguet, Northern Luzon' },
  ];

  const destinationMap = new Map<string, string>();
  for (const d of destinationsData) {
    const record = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: { name: d.name, sortOrder: d.sortOrder },
      create: d,
    });
    destinationMap.set(d.slug, record.id);
  }
  console.log('📍 Destinations seeded');

  // 3. Vehicles
  const vehiclesData = [
    {
      slug: 'toyota-vios-2025-at',
      name: 'Toyota Vios 2025 AT',
      category: VehicleCategory.SEDAN,
      make: 'Toyota',
      model: 'Vios',
      year: 2025,
      transmission: Transmission.AT,
      seats: 5,
      fuelType: 'Gasoline',
      color: 'White',
      plateNumber: 'NAG-2025',
      description: 'Brand new 2025 Toyota Vios Automatic. Extremely fuel-efficient, smooth transmission, premium cool airconditioning, touch screen infotainment with Apple CarPlay & Android Auto.',
      features: ['Automatic Transmission', 'Touchscreen Audio', 'Bluetooth / CarPlay', 'Backup Camera', 'Fuel Efficient 1.3L Dual VVT-i', 'Airbags & ABS'],
      allowSelfDrive: true,
      allowWithDriver: true,
      isFeatured: true,
      sortOrder: 1,
      imageFile: '/images/vehicle-vios.jpg',
    },
    {
      slug: 'mitsubishi-mirage-g4-at',
      name: 'Mitsubishi Mirage G4 AT',
      category: VehicleCategory.SEDAN,
      make: 'Mitsubishi',
      model: 'Mirage G4',
      year: 2024,
      transmission: Transmission.AT,
      seats: 5,
      fuelType: 'Gasoline',
      color: 'Cool Silver Metallic',
      plateNumber: 'MIR-4421',
      description: 'Zippy and economical Mitsubishi Mirage G4 sedan with CVT. Spacious legroom and trunk, easy city driving and highway cruising across Bicol.',
      features: ['Automatic CVT', 'Spacious Trunk', 'Cold Air Conditioning', 'Eco-Drive Indicator', 'Keyless Entry', 'Bluetooth Stereo'],
      allowSelfDrive: true,
      allowWithDriver: true,
      isFeatured: true,
      sortOrder: 2,
      imageFile: '/images/vehicle-mirage.jpg',
    },
    {
      slug: 'mitsubishi-xpander-at',
      name: 'Mitsubishi Xpander AT',
      category: VehicleCategory.SUV_MPV,
      make: 'Mitsubishi',
      model: 'Xpander',
      year: 2024,
      transmission: Transmission.AT,
      seats: 7,
      fuelType: 'Gasoline',
      color: 'Silver',
      plateNumber: 'XPN-7070',
      description: 'Modern 7-seater compact MPV with SUV ground clearance. Flexible folding rear seats, dual blower air conditioning, ideal for family vacations and out-of-town trips.',
      features: ['7-Seater Capacity', 'High Ground Clearance (225mm)', 'Rear AC Vents', 'Fold-Flat 3rd Row', 'USB Charging Ports', 'Cruise Control'],
      allowSelfDrive: true,
      allowWithDriver: true,
      isFeatured: true,
      sortOrder: 3,
      imageFile: '/images/vehicle-xpander.jpg',
    },
    {
      slug: 'toyota-innova-at',
      name: 'Toyota Innova AT',
      category: VehicleCategory.SUV_MPV,
      make: 'Toyota',
      model: 'Innova',
      year: 2024,
      transmission: Transmission.AT,
      seats: 8,
      fuelType: 'Diesel',
      color: 'Dark Gray',
      plateNumber: 'INV-8812',
      description: 'Powerful 2.8L turbo diesel 8-seater MPV. Proven durability and comfort for long road trips across Camarines Sur, Albay, Sorsogon, and Manila.',
      features: ['8-Seater Capacity', '2.8L Turbo Diesel', 'Rear Air Conditioning', 'Spacious Cabin', 'Power Steering & Windows', 'Dual SRS Airbags'],
      allowSelfDrive: true,
      allowWithDriver: true,
      isFeatured: true,
      sortOrder: 4,
      imageFile: '/images/vehicle-innova.jpg',
    },
    {
      slug: 'nissan-nv350-urvan-mt',
      name: 'Nissan NV350 Urvan MT',
      category: VehicleCategory.VAN,
      make: 'Nissan',
      model: 'NV350 Urvan',
      year: 2022,
      transmission: Transmission.MT,
      seats: 15,
      fuelType: 'Diesel',
      color: 'White',
      plateNumber: 'NVV-3501',
      description: 'Full-size 15-passenger commuter van powered by a strong diesel engine. Perfect for corporate shuttles, tour groups, team outings, Baguio & Manila long hauls.',
      features: ['15-Passenger Capacity', 'Dual Front & Ceiling AC Vents', 'High-Roof Clearance', 'Strong Turbo Diesel Engine', 'Large Luggage Space', 'Fire Extinguisher & First Aid Kit'],
      allowSelfDrive: true,
      allowWithDriver: true,
      isFeatured: true,
      sortOrder: 5,
      imageFile: '/images/vehicle-nv350.jpg',
    },
  ];

  const vehicleMap = new Map<string, string>();
  for (const v of vehiclesData) {
    const { imageFile, ...vehicleAttrs } = v;
    const record = await prisma.vehicle.upsert({
      where: { slug: v.slug },
      update: vehicleAttrs,
      create: vehicleAttrs,
    });
    vehicleMap.set(v.slug, record.id);

    // Seed image
    await prisma.vehicleImage.deleteMany({ where: { vehicleId: record.id } });
    await prisma.vehicleImage.create({
      data: {
        vehicleId: record.id,
        url: imageFile,
        isPrimary: true,
        sortOrder: 0,
      },
    });
  }
  console.log('🚗 Vehicles seeded with images');

  // 4. Official Custoworks Rates Matrix
  // 1. SEDAN RATES (Toyota Vios & Mitsubishi Mirage G4)
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

  async function applyRates(vehicleSlug: string, list: any[]) {
    const vehicleId = vehicleMap.get(vehicleSlug)!;
    for (const r of list) {
      const destinationId = destinationMap.get(r.dest);
      if (!destinationId) continue;
      await prisma.vehicleRate.upsert({
        where: {
          vehicleId_destinationId_rentalType_duration: {
            vehicleId,
            destinationId,
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
          destinationId,
          rentalType: r.type,
          duration: r.dur,
          amount: r.amt,
          isPublished: true,
          pricingUnit: r.unit || PricingUnit.PER_DAY,
        },
      });
    }
  }

  await applyRates('toyota-vios-2025-at', sedanRates);
  await applyRates('mitsubishi-mirage-g4-at', sedanRates);
  await applyRates('mitsubishi-xpander-at', xpanderRates);
  await applyRates('toyota-innova-at', innovaRates);
  await applyRates('nissan-nv350-urvan-mt', vanRates);
  console.log('💰 Rate matrices seeded for all 5 vehicles');

  // 5. Additional Fees (Delivery, Surcharges, Carwash)
  const additionalFees = [
    {
      code: 'DELIVERY_NAGA',
      name: 'Delivery Fee – Naga City Area',
      description: 'Vehicle delivery & return pick-up within Naga City proper',
      type: FeeType.DELIVERY,
      amount: 300,
      sortOrder: 1,
    },
    {
      code: 'DELIVERY_PILI',
      name: 'Delivery Fee – Pili Area',
      description: 'Vehicle delivery & return pick-up in Pili (including Naga Airport)',
      type: FeeType.DELIVERY,
      amount: 400,
      sortOrder: 2,
    },
    {
      code: 'DELIVERY_SURCHARGE_FAR',
      name: 'Remote Area Surcharge (Ragay, Siruma, Caramoan, Garchitorena)',
      description: 'Additional surcharge for distant or rugged municipalities',
      type: FeeType.DELIVERY_SURCHARGE,
      amount: 500,
      sortOrder: 3,
    },
    {
      code: 'CARWASH_SEDAN',
      name: 'Carwash Fee (Sedan)',
      description: 'Post-rental carwash deducted from security deposit only if returned unwashed: PHP 300',
      type: FeeType.CARWASH,
      amount: 300,
      vehicleCategory: VehicleCategory.SEDAN,
      sortOrder: 4,
    },
    {
      code: 'CARWASH_MPV_SUV',
      name: 'Carwash Fee (SUV / MPV)',
      description: 'Post-rental carwash deducted from security deposit only if returned unwashed: PHP 400',
      type: FeeType.CARWASH,
      amount: 400,
      vehicleCategory: VehicleCategory.SUV_MPV,
      sortOrder: 5,
    },
    {
      code: 'CARWASH_VAN',
      name: 'Carwash Fee (Van)',
      description: 'Post-rental carwash deducted from security deposit only if returned unwashed: PHP 400',
      type: FeeType.CARWASH,
      amount: 400,
      vehicleCategory: VehicleCategory.VAN,
      sortOrder: 6,
    },
  ];

  for (const f of additionalFees) {
    await prisma.additionalFee.upsert({
      where: { code: f.code },
      update: f,
      create: f,
    });
  }
  console.log('🏷️ Additional fees seeded');

  // 6. Payment Methods (BPI, BDO, GCash, Cash)
  const paymentMethods = [
    {
      code: 'GCASH',
      name: 'GCash',
      kind: PaymentMethodKind.E_WALLET,
      accountName: 'Custoworks Car Rental',
      accountNumber: '0961 722 5326 / 0995 382 7972',
      instructions: 'Send the PHP 1,000 reservation fee to our GCash account: Primary 0961 722 5326 | Secondary 0995 382 7972. Take a screenshot of the confirmation receipt and upload it below.',
      isCustomerSelectable: true,
      sortOrder: 1,
    },
    {
      code: 'BPI',
      name: 'BPI (Bank of the Philippine Islands)',
      kind: PaymentMethodKind.BANK_TRANSFER,
      accountName: 'Custoworks Car Rental Services',
      accountNumber: '1234-5678-90',
      instructions: 'Transfer the PHP 1,000 reservation fee via BPI Online / InstaPay. Upload the screenshot showing the reference number and date.',
      isCustomerSelectable: true,
      sortOrder: 2,
    },
    {
      code: 'BDO',
      name: 'BDO Unibank',
      kind: PaymentMethodKind.BANK_TRANSFER,
      accountName: 'Custoworks Car Rental Services',
      accountNumber: '0098-7654-3210',
      instructions: 'Transfer the PHP 1,000 reservation fee via BDO Online / InstaPay. Upload the confirmation screenshot.',
      isCustomerSelectable: true,
      sortOrder: 3,
    },
    {
      code: 'CASH',
      name: 'Cash Upon Vehicle Pick-up (Balance)',
      kind: PaymentMethodKind.CASH,
      accountName: 'Custoworks Office',
      accountNumber: 'Naga City Office',
      instructions: 'Pay remaining rental balance in cash during vehicle release at our office.',
      isCustomerSelectable: false,
      sortOrder: 4,
    },
  ];

  for (const m of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
  }
  console.log('💳 Payment methods seeded');

  // 7. Requirement Types (Official Custoworks Document Verification)
  const requirementTypes = [
    {
      code: 'PHYSICAL_LICENSE',
      name: "Physical Driver's License",
      description: "Mandatory: Clear photo of the front and back of your official physical driver's license card.",
      appliesTo: RequirementAppliesTo.SELF_DRIVE,
      isRequired: true,
      options: [],
      sortOrder: 1,
    },
    {
      code: 'SECONDARY_ID',
      name: 'One (1) Valid Secondary Government ID',
      description: 'Choose and upload one recognized secondary ID card.',
      appliesTo: RequirementAppliesTo.SELF_DRIVE,
      isRequired: true,
      options: ['Passport', 'PhilHealth ID', 'UMID / SSS ID', "Voter's ID", 'PRC ID', 'Company ID with Photo', 'School ID with Photo'],
      sortOrder: 2,
    },
    {
      code: 'SELFIE_WITH_LICENSE',
      name: "Selfie Holding Physical Driver's License",
      description: "Upload a clear selfie holding your physical driver's license beside your face.",
      appliesTo: RequirementAppliesTo.SELF_DRIVE,
      isRequired: true,
      options: [],
      sortOrder: 3,
    },
    {
      code: 'LTMS_QR',
      name: 'LTMS Portal QR Code',
      description: 'Optional / Recommended: If you have an active LTO LTMS account, upload the QR code for expedited verification.',
      appliesTo: RequirementAppliesTo.SELF_DRIVE,
      isRequired: false,
      options: [],
      sortOrder: 4,
    },
    {
      code: 'DIGITAL_LICENSE',
      name: "Digital Driver's License",
      description: "Optional / Alternative: Screenshot of digital license from LTMS portal if physical card is not on hand.",
      appliesTo: RequirementAppliesTo.SELF_DRIVE,
      isRequired: false,
      options: [],
      sortOrder: 5,
    },
    {
      code: 'WITH_DRIVER_ID',
      name: 'Primary Contact Identification',
      description: 'Upload a valid government ID for the primary booking contact.',
      appliesTo: RequirementAppliesTo.WITH_DRIVER,
      isRequired: true,
      options: ['Passport', "Driver's License", 'UMID / SSS ID', 'PhilHealth ID', 'National ID'],
      sortOrder: 6,
    },
  ];

  for (const t of requirementTypes) {
    await prisma.requirementType.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
  }
  console.log('📋 Requirement types seeded');

  // 8. Sample Promotion
  await prisma.promotion.upsert({
    where: { code: 'BICOLROADTRIP' },
    update: {},
    create: {
      name: 'Bicol Roadtrip Promo',
      code: 'BICOLROADTRIP',
      description: 'PHP 500 OFF for bookings of 3 days or longer',
      discountType: 'FIXED',
      value: 500,
      minDays: 3,
      isActive: true,
    },
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
