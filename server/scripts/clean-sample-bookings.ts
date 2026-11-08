import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning Sample Booking & Transactional Data ---');

  // Delete all booking-related child records in reverse dependency order
  const deletedReviews = await prisma.requirementReview.deleteMany({});
  console.log(`✓ Deleted ${deletedReviews.count} requirement reviews`);

  const deletedDocs = await prisma.requirementDocument.deleteMany({});
  console.log(`✓ Deleted ${deletedDocs.count} requirement documents`);

  const deletedReqs = await prisma.bookingRequirement.deleteMany({});
  console.log(`✓ Deleted ${deletedReqs.count} booking requirements`);

  const deletedAgreements = await prisma.rentalAgreement.deleteMany({});
  console.log(`✓ Deleted ${deletedAgreements.count} rental agreements`);

  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`✓ Deleted ${deletedPayments.count} payments`);

  const deletedFees = await prisma.bookingFee.deleteMany({});
  console.log(`✓ Deleted ${deletedFees.count} booking fees`);

  const deletedHistory = await prisma.bookingStatusHistory.deleteMany({});
  console.log(`✓ Deleted ${deletedHistory.count} booking status history records`);

  const deletedNotes = await prisma.bookingNote.deleteMany({});
  console.log(`✓ Deleted ${deletedNotes.count} booking notes`);

  const deletedRequests = await prisma.bookingRequest.deleteMany({});
  console.log(`✓ Deleted ${deletedRequests.count} booking requests`);

  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`✓ Deleted ${deletedNotifications.count} notifications`);

  // Delete all bookings
  const deletedBookings = await prisma.booking.deleteMany({});
  console.log(`✓ Deleted ${deletedBookings.count} bookings`);

  // Reset all vehicles to AVAILABLE
  const updatedVehicles = await prisma.vehicle.updateMany({
    data: { status: 'AVAILABLE' },
  });
  console.log(`✓ Reset ${updatedVehicles.count} fleet vehicles to status: AVAILABLE`);

  // Keep intact:
  const vehicleCount = await prisma.vehicle.count();
  const destCount = await prisma.destination.count();
  const rateCount = await prisma.vehicleRate.count();
  const userCount = await prisma.user.count();
  const feeCount = await prisma.additionalFee.count();
  const paymentMethodCount = await prisma.paymentMethod.count();
  const settingCount = await prisma.setting.count();

  console.log('\n--- Operational Core Data Preserved Intact ---');
  console.log(`Fleet Vehicles: ${vehicleCount}`);
  console.log(`Destinations: ${destCount}`);
  console.log(`Rate Plans: ${rateCount}`);
  console.log(`Users (Admin/Staff): ${userCount}`);
  console.log(`Additional Fees: ${feeCount}`);
  console.log(`Payment Methods: ${paymentMethodCount}`);
  console.log(`Settings: ${settingCount}`);
  console.log('\n✨ Database is now completely clean and ready for real bookings!');
}

main()
  .catch((e) => {
    console.error('Error during sample data cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
