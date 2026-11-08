import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetTestData() {
  console.log('🧹 Purging all sample and test transactional data...');

  // 1. Delete all booking child records
  console.log('Deleting booking status history...');
  await prisma.bookingStatusHistory.deleteMany({});

  console.log('Deleting booking notes...');
  await prisma.bookingNote.deleteMany({});

  console.log('Deleting booking fees...');
  await prisma.bookingFee.deleteMany({});

  console.log('Deleting requirement reviews...');
  await prisma.requirementReview.deleteMany({});

  console.log('Deleting requirement documents...');
  await prisma.requirementDocument.deleteMany({});

  console.log('Deleting booking requirements...');
  await prisma.bookingRequirement.deleteMany({});

  console.log('Deleting rental agreements...');
  await prisma.rentalAgreement.deleteMany({});

  console.log('Deleting payments...');
  await prisma.payment.deleteMany({});

  // 2. Delete bookings
  console.log('Deleting all bookings...');
  const { count: deletedBookings } = await prisma.booking.deleteMany({});
  console.log(`Deleted ${deletedBookings} booking(s).`);

  // 3. Delete booking requests / quotations
  console.log('Deleting booking requests (quotations)...');
  const { count: deletedRequests } = await prisma.bookingRequest.deleteMany({});
  console.log(`Deleted ${deletedRequests} booking request(s).`);

  // 4. Delete partner applications
  console.log('Deleting partner applications...');
  const { count: deletedPartners } = await prisma.partnerApplication.deleteMany({});
  console.log(`Deleted ${deletedPartners} partner application(s).`);

  // 5. Delete notifications & audit logs
  console.log('Deleting notifications and audit logs...');
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // 6. Delete test / demo customer accounts (keep admin accounts)
  console.log('Deleting non-admin demo users...');
  const testUsers = await prisma.user.findMany({
    where: {
      role: { not: 'ADMIN' },
    },
    select: { id: true, email: true },
  });

  for (const u of testUsers) {
    await prisma.customerProfile.deleteMany({ where: { userId: u.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`Removed test user: ${u.email}`);
  }

  // 7. Reset vehicle availability
  console.log('Resetting vehicle availability blocks...');
  await prisma.vehicleAvailability.deleteMany({});

  console.log('✅ Database successfully wiped clean! Ready for live production launch.');
}

resetTestData()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
