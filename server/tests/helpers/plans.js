import { prisma } from '../../src/lib/prisma.js';

// Creates a membership plan directly in the test database.
// classesPerMonth: 0 = Basic (gym only), e.g. 10 = Premium.
export function createPlan({ name = `Plan ${Math.random()}`, durationMonths = 1, price = 1000, isActive = true, classesPerMonth = 0 } = {}) {
  return prisma.membershipPlan.create({ data: { name, durationMonths, price, isActive, classesPerMonth } });
}
