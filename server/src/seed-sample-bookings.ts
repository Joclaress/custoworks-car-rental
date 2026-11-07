import { prisma } from './lib/prisma';

async function seedSampleRentals() {
  console.log('Seeding sample bookings for Mirage G4 and fleet...');

  // 1. Get Mirage G4 vehicle
  const mirage = await prisma.vehicle.findFirst({
    where: { slug: { contains: 'mirage' } },
  });

  const vios = await prisma.vehicle.findFirst({
    where: { slug: { contains: 'vios' } },
  });

  const innova = await prisma.vehicle.findFirst({
    where: { slug: { contains: 'innova' } },
  });

  if (!mirage) {
    console.error('Mirage not found in DB!');
    return;
  }

  // 2. Get Naga City destination
  const dest = await prisma.destination.findFirst({
    where: { name: { contains: 'Naga' } },
  });

  // 3. Get customer user
  let customer = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
  });

  if (!customer) {
    customer = await prisma.user.findFirst({
      where: { email: 'custoworks1@gmail.com' },
    });
  }

  // 4. Get payment methods
  const gcash = await prisma.paymentMethod.findFirst({ where: { code: 'GCASH' } });
  const bdo = await prisma.paymentMethod.findFirst({ where: { code: 'BDO' } });
  const cash = await prisma.paymentMethod.findFirst({ where: { code: 'CASH' } });

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  // 5. Create multiple 24h Mirage bookings for this month (November 2026)
  // Example: 24hrs = ₱2,500 per booking (₱500 reservation fee + ₱2,000 rental balance)
  const sampleBookings = [
    {
      vehicleId: mirage.id,
      customerName: 'Maria Santos',
      customerEmail: 'maria.santos@gmail.com',
      customerPhone: '0917 882 1234',
      daysAgo: 6,
      durationHours: 24,
      totalAmount: 2500,
      reservationFee: 500,
      balance: 2000,
      status: 'COMPLETED' as const,
      paymentMethodId: gcash?.id || '',
      note: '24-hour self-drive around Naga City. Clean return.',
    },
    {
      vehicleId: mirage.id,
      customerName: 'Carlos Mendoza',
      customerEmail: 'carlos.mendoza@yahoo.com',
      customerPhone: '0918 334 5678',
      daysAgo: 4,
      durationHours: 24,
      totalAmount: 2500,
      reservationFee: 500,
      balance: 2000,
      status: 'COMPLETED' as const,
      paymentMethodId: bdo?.id || '',
      note: '24-hour trip to Pili & Naga CBD. All verified.',
    },
    {
      vehicleId: mirage.id,
      customerName: 'Mark Angelo Rivera',
      customerEmail: 'mark.rivera@gmail.com',
      customerPhone: '0920 445 6789',
      daysAgo: 2,
      durationHours: 24,
      totalAmount: 2500,
      reservationFee: 500,
      balance: 2000,
      status: 'COMPLETED' as const,
      paymentMethodId: gcash?.id || '',
      note: '24-hour business meeting rental in Naga.',
    },
    {
      vehicleId: mirage.id,
      customerName: 'Elena Roxas',
      customerEmail: 'elena.roxas@outlook.com',
      customerPhone: '0927 556 7890',
      daysAgo: 1,
      durationHours: 24,
      totalAmount: 2500,
      reservationFee: 500,
      balance: 2000,
      status: 'ONGOING' as const,
      paymentMethodId: gcash?.id || '',
      note: 'Active 24hr rental today. Vehicle released.',
    },
    {
      vehicleId: mirage.id,
      customerName: 'Gerald De Leon',
      customerEmail: 'gerald.deleon@gmail.com',
      customerPhone: '0995 112 2334',
      daysAgo: 0,
      durationHours: 24,
      totalAmount: 2500,
      reservationFee: 500,
      balance: 2000,
      status: 'CONFIRMED' as const,
      paymentMethodId: bdo?.id || '',
      note: 'Confirmed upcoming 24h rental. Reservation fee paid.',
    },
  ];

  // Optional: add a Vios and Innova rental to show full fleet gross
  if (vios) {
    sampleBookings.push({
      vehicleId: vios.id,
      customerName: 'Patricia Tan',
      customerEmail: 'patricia.tan@gmail.com',
      customerPhone: '0919 778 8990',
      daysAgo: 5,
      durationHours: 48,
      totalAmount: 4000,
      reservationFee: 500,
      balance: 3500,
      status: 'COMPLETED' as const,
      paymentMethodId: gcash?.id || '',
      note: '2-day Vios rental to Albay.',
    });
  }

  if (innova) {
    sampleBookings.push({
      vehicleId: innova.id,
      customerName: 'Roberto Gomez',
      customerEmail: 'roberto.gomez@gmail.com',
      customerPhone: '0908 990 0112',
      daysAgo: 3,
      durationHours: 24,
      totalAmount: 3500,
      reservationFee: 500,
      balance: 3000,
      status: 'COMPLETED' as const,
      paymentMethodId: bdo?.id || '',
      note: '1-day family tour Innova rental.',
    });
  }

  const now = new Date();

  for (let i = 0; i < sampleBookings.length; i++) {
    const b = sampleBookings[i];
    const pickup = new Date(now.getTime() - b.daysAgo * 86_400_000);
    const returnAt = new Date(pickup.getTime() + b.durationHours * 3600_000);
    const ref = `CW-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(1001 + i)}`;

    // Check if reference already exists
    const existing = await prisma.booking.findUnique({ where: { reference: ref } });
    if (existing) {
      console.log(`Booking ${ref} already exists, skipping...`);
      continue;
    }

    const booking = await prisma.booking.create({
      data: {
        reference: ref,
        customerId: customer!.id,
        vehicleId: b.vehicleId,
        destinationId: dest!.id,
        rentalType: 'SELF_DRIVE',
        pickupAt: pickup,
        returnAt: returnAt,
        status: b.status,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        customerAddress: 'Naga City, Camarines Sur',
        ratePlan: 'HOURS_24',
        rentalDays: Math.ceil(b.durationHours / 24),
        rentalHours: b.durationHours,
        rentalFee: b.totalAmount,
        totalAmount: b.totalAmount,
        reservationFee: b.reservationFee,
        pricingBreakdown: {
          baseDailyRate: 2500,
          rentalFee: b.totalAmount,
          reservationFee: b.reservationFee,
        },
        createdAt: pickup,
        confirmedAt: pickup,
      },
    });

    console.log(`Created booking: ${ref} for ${b.customerName} (PHP ${b.totalAmount})`);

    // 1. Reservation Fee Payment (₱500)
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        paymentMethodId: b.paymentMethodId || gcash!.id,
        type: 'RESERVATION_FEE',
        status: 'APPROVED',
        amount: b.reservationFee,
        referenceNumber: `GC-REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
        verifiedById: admin?.id,
        paidAt: pickup,
        verifiedAt: pickup,
        createdAt: pickup,
      },
    });

    // 2. Rental Balance Payment (if completed or ongoing)
    if (b.status === 'COMPLETED' || b.status === 'ONGOING') {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          paymentMethodId: cash?.id || gcash!.id,
          type: 'RENTAL_BALANCE',
          status: 'APPROVED',
          amount: b.balance,
          referenceNumber: `BAL-${Math.floor(10000000 + Math.random() * 90000000)}`,
          verifiedById: admin?.id,
          paidAt: pickup,
          verifiedAt: pickup,
          createdAt: pickup,
        },
      });
    }
  }

  console.log('Sample bookings & verified payments created successfully!');
}

seedSampleRentals()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
