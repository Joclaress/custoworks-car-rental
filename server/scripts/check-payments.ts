import { PrismaClient } from '@prisma/client';

const p = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LIVE_DATABASE_URL || 'postgresql://custoworks_user:SI8EljsUouMykcmJJHLmlCBgSo1VxvTZ@dpg-dbn8n7c9v7es73c22ptg-a.singapore-postgres.render.com/custoworks',
    },
  },
});

async function main() {
  const bookings = await p.booking.findMany({
    include: {
      vehicle: true,
      payments: true,
    },
  });

  console.log(`Found ${bookings.length} bookings:`);
  for (const b of bookings) {
    console.log(`\nBooking Ref: ${b.reference}`);
    console.log(`  Customer: ${b.customerName}`);
    console.log(`  Vehicle: ${b.vehicle.name} (${b.vehicle.plateNumber})`);
    console.log(`  Total Rental Amount: ₱${b.totalAmount}`);
    console.log(`  Reservation Fee (Deposit): ₱${b.reservationFee}`);
    console.log(`  Remaining Balance: ₱${b.balanceAmount}`);
    console.log(`  Status: ${b.status}`);
    console.log(`  Payments (${b.payments.length}):`);
    for (const pay of b.payments) {
      console.log(`    - ID: ${pay.id} | Type: ${pay.type} | Amount: ₱${pay.amount} | Status: ${pay.status}`);
    }
  }
}

main().finally(() => p.$disconnect());
