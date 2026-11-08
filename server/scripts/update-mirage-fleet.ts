import { PrismaClient, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚗 Updating Mirage fleet: 1 published model, 5 available sedan units in fleet...');

  // 1. Primary Mirage model (Published)
  const primaryMirage = await prisma.vehicle.upsert({
    where: { slug: 'mitsubishi-mirage-g4-at' },
    update: {
      name: 'Mitsubishi Mirage G4 AT',
      model: 'Mirage G4',
      status: VehicleStatus.AVAILABLE,
      isPublished: true,
      sortOrder: 2,
    },
    create: {
      slug: 'mitsubishi-mirage-g4-at',
      name: 'Mitsubishi Mirage G4 AT',
      category: 'SEDAN',
      make: 'Mitsubishi',
      model: 'Mirage G4',
      year: 2024,
      transmission: 'AT',
      seats: 5,
      fuelType: 'Gasoline',
      color: 'Cool Silver Metallic',
      plateNumber: 'MIR-4421',
      description: 'Fuel-efficient, reliable 5-seater sedan perfect for city driving and long road trips across Camarines Sur and Bicol.',
      features: ['Automatic Transmission', 'Touchscreen Infotainment', 'Bluetooth Connectivity', 'Cool Air Conditioning', 'Dual Airbags & ABS', 'Fuel Efficient 1.2L MIVEC Engine'],
      allowSelfDrive: true,
      allowWithDriver: true,
      status: VehicleStatus.AVAILABLE,
      isPublished: true,
      isFeatured: true,
      sortOrder: 2,
    },
  });

  // 2. Sibling fleet units: keep model = 'Mirage G4', status = AVAILABLE, isPublished = false
  const siblingSlugs = [
    { slug: 'mitsubishi-mirage-g4-unit-2', plate: 'MIR-8832' },
    { slug: 'mitsubishi-mirage-g4-unit-3', plate: 'MIR-1904' },
    { slug: 'mitsubishi-mirage-g4-unit-4', plate: 'MIR-5567' },
    { slug: 'mitsubishi-mirage-g4-unit-5', plate: 'MIR-9213' },
  ];

  for (const s of siblingSlugs) {
    await prisma.vehicle.upsert({
      where: { slug: s.slug },
      update: {
        model: 'Mirage G4',
        status: VehicleStatus.AVAILABLE,
        isPublished: false,
      },
      create: {
        slug: s.slug,
        name: `Mitsubishi Mirage G4 AT (${s.plate})`,
        category: 'SEDAN',
        make: 'Mitsubishi',
        model: 'Mirage G4',
        year: 2024,
        transmission: 'AT',
        seats: 5,
        fuelType: 'Gasoline',
        color: 'Cool Silver Metallic',
        plateNumber: s.plate,
        status: VehicleStatus.AVAILABLE,
        isPublished: false,
        sortOrder: 99,
      },
    });
  }

  // Count total fleet units for Mirage G4
  const allMirageUnits = await prisma.vehicle.findMany({
    where: { model: 'Mirage G4', deletedAt: null },
  });

  console.log(`✅ Mirage fleet updated:`);
  console.log(`   - Primary Published Model: ${primaryMirage.name} (isPublished: true)`);
  console.log(`   - Total Mirage units in fleet: ${allMirageUnits.length}`);
  console.log(`   - Available Mirage units: ${allMirageUnits.filter(u => u.status === 'AVAILABLE').length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
