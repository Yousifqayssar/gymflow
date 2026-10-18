import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

const PERSON = { select: { id: true, firstName: true, lastName: true, avatar: true } };

// Everything a plan page needs: member, author, days in order, exercises in order with their details.
const PLAN_INCLUDE = {
  member: PERSON,
  author: PERSON,
  days: {
    orderBy: { position: 'asc' },
    include: {
      exercises: {
        orderBy: { position: 'asc' },
        include: { exercise: { select: { id: true, name: true, muscleGroup: true, equipment: true, description: true } } },
      },
    },
  },
};

function toPublicPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    notes: plan.notes,
    isActive: plan.isActive,
    member: plan.member,
    author: plan.author,
    updatedAt: plan.updatedAt,
    days: plan.days.map((day) => ({
      id: day.id,
      name: day.name,
      exercises: day.exercises.map((item) => ({
        id: item.id,
        exercise: item.exercise,
        sets: item.sets,
        reps: item.reps,
        targetWeightKg: item.targetWeightKg === null ? null : Number(item.targetWeightKg),
        restSeconds: item.restSeconds,
        notes: item.notes,
      })),
    })),
  };
}

// The nested "create" data for the days and their exercises, with positions from the list order.
function daysData(days) {
  return days.map((day, dayIndex) => ({
    name: day.name,
    position: dayIndex,
    exercises: {
      create: day.exercises.map((item, index) => ({
        exerciseId: item.exerciseId,
        position: index,
        sets: item.sets,
        reps: item.reps,
        targetWeightKg: item.targetWeightKg ?? null,
        restSeconds: item.restSeconds,
        notes: item.notes ?? null,
      })),
    },
  }));
}

// Business rules shared by create and update: the plan is for a member, and every exercise
// exists and is active (a removed exercise cannot be put into a new or changed plan).
async function checkPlanInput(db, input) {
  const member = await db.user.findUnique({ where: { id: input.memberId } });
  if (!member || member.role !== 'MEMBER') {
    throw new AppError(400, 'Workout plans can only be made for members');
  }
  const ids = [...new Set(input.days.flatMap((day) => day.exercises.map((item) => item.exerciseId)))];
  const found = await db.exercise.count({ where: { id: { in: ids }, isActive: true } });
  if (found !== ids.length) {
    throw new AppError(400, 'Every exercise must be an active exercise from the library');
  }
}

// Business rule: a trainer may only change plans they wrote; an admin may change every plan.
function checkCanEdit(plan, user) {
  if (user.role !== 'ADMIN' && plan.authorId !== user.id) {
    throw new AppError(403, 'Only the trainer who wrote this plan (or an admin) can change it');
  }
}

async function findPlanOrThrow(id) {
  const plan = await prisma.workoutPlan.findUnique({ where: { id }, include: PLAN_INCLUDE });
  if (!plan) throw new AppError(404, 'Workout plan not found');
  return plan;
}

// POST /api/workout-plans (Admin, Trainer)
export async function createWorkoutPlan(input, user) {
  return prisma.$transaction(async (tx) => {
    await checkPlanInput(tx, input);
    const plan = await tx.workoutPlan.create({
      data: {
        memberId: input.memberId,
        authorId: user.id,
        name: input.name,
        notes: input.notes,
        isActive: input.isActive ?? true,
        days: { create: daysData(input.days) },
      },
      include: PLAN_INCLUDE,
    });
    return toPublicPlan(plan);
  });
}

// PUT /api/workout-plans/:id (the author or an admin) – replaces name, notes, status and all days.
export async function updateWorkoutPlan(id, input, user) {
  const existing = await findPlanOrThrow(id);
  checkCanEdit(existing, user);
  if (input.memberId !== existing.memberId) {
    throw new AppError(400, 'A plan cannot be moved to another member');
  }
  return prisma.$transaction(async (tx) => {
    await checkPlanInput(tx, input);
    await tx.workoutDay.deleteMany({ where: { planId: id } }); // their exercises go with them (cascade)
    const plan = await tx.workoutPlan.update({
      where: { id },
      data: {
        name: input.name,
        notes: input.notes,
        isActive: input.isActive ?? existing.isActive,
        days: { create: daysData(input.days) },
      },
      include: PLAN_INCLUDE,
    });
    return toPublicPlan(plan);
  });
}

// GET /api/workout-plans?memberId= (Admin, Trainer) – all plans, or the plans of one member; newest first.
export async function listWorkoutPlans({ memberId }) {
  const plans = await prisma.workoutPlan.findMany({
    where: memberId ? { memberId } : {},
    include: PLAN_INCLUDE,
    orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
  });
  return plans.map(toPublicPlan);
}

// GET /api/workout-plans/:id – staff see every plan, a member only their own.
export async function getWorkoutPlan(id, user) {
  const plan = await findPlanOrThrow(id);
  if (user.role === 'MEMBER' && plan.memberId !== user.id) {
    throw new AppError(404, 'Workout plan not found'); // 404, not 403: do not reveal that it exists
  }
  return toPublicPlan(plan);
}

// GET /api/me/workout-plans (Member) – the member's active plans.
export async function listMyWorkoutPlans(memberId) {
  const plans = await prisma.workoutPlan.findMany({
    where: { memberId, isActive: true },
    include: PLAN_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  });
  return plans.map(toPublicPlan);
}

// GET /api/members?search= (Admin, Trainer) – members to choose from when writing a plan.
// Only what is needed to pick the right person: no emails, no memberships.
export async function listMembersForStaff({ search }) {
  const contains = search ? { contains: search, mode: 'insensitive' } : undefined;
  return prisma.user.findMany({
    where: { role: 'MEMBER', ...(contains && { OR: [{ firstName: contains }, { lastName: contains }] }) },
    select: { id: true, firstName: true, lastName: true, avatar: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    take: 50,
  });
}
