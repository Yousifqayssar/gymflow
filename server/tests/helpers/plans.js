import { prisma } from '../../src/lib/prisma.js';

// Creates a membership plan directly in the test database.
export function createPlan({ name = `Plan ${Math.random()}`, durationMonths = 1, price = 1000, isActive = true } = {}) {
  return prisma.membershipPlan.create({ data: { name, durationMonths, price, isActive } });
}
