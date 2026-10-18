import { prisma } from '../../src/lib/prisma.js';

// Empties all tables so every test starts from a known, clean state.
// RESTART IDENTITY resets the id counters back to 1.
// CASCADE also empties tables that reference these ones.
export async function resetDatabase() {
  await prisma.$executeRaw`TRUNCATE TABLE "CheckIn", "Booking", "GymClass", "Membership", "MembershipPlan", "PartnerGym", "User" RESTART IDENTITY CASCADE`;
}
