import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

// The plan as sent to clients. The price is a string ("2500.00") so it stays exact:
// JSON numbers are floating-point, which is not safe for money.
export function toPublicPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    durationMonths: plan.durationMonths,
    price: plan.price.toFixed(2),
    classesPerMonth: plan.classesPerMonth, // 0 = Basic (gym only)
    isActive: plan.isActive,
  };
}

// Admins see all plans; everyone else only sees plans that can be sold.
export async function listPlans({ includeInactive }) {
  const plans = await prisma.membershipPlan.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ isActive: 'desc' }, { durationMonths: 'asc' }, { name: 'asc' }],
  });
  return plans.map(toPublicPlan);
}

export async function createPlan({ name, description, durationMonths, price, classesPerMonth }) {
  await assertNameIsFree(name);

  const plan = await prisma.membershipPlan.create({ data: { name, description, durationMonths, price, classesPerMonth } });
  return toPublicPlan(plan);
}

export async function updatePlan(id, changes) {
  await findPlanOrThrow(id);
  if (changes.name !== undefined) {
    await assertNameIsFree(changes.name, id);
  }

  // Changing the price or classes per month only affects future sales: each membership keeps its own.
  const plan = await prisma.membershipPlan.update({ where: { id }, data: changes });
  return toPublicPlan(plan);
}

export async function findPlanOrThrow(id) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) {
    throw new AppError(404, 'Plan not found');
  }
  return plan;
}

// Plan names must be unique, ignoring letter case ("Monthly" and "monthly" are the same plan).
async function assertNameIsFree(name, exceptId) {
  const existing = await prisma.membershipPlan.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
  });
  if (existing) {
    throw new AppError(409, 'A plan with this name already exists');
  }
}
