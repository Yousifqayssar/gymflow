// Demo data for trying out and presenting GymFlow: plans, trainers and members in every
// membership situation. Dates are relative to "today", so the demo always looks current.
//
// Safety: demo accounts are recognised by their email domain. Re-running replaces only
// demo accounts; real data (other users, their memberships) is never changed.
import { addDays, calculateEndDate, todayInGym } from '../src/utils/dates.js';
import { hashPassword } from '../src/utils/password.js';
import { seedDemoClasses } from './demo-classes.js';
import { seedDemoCheckIns } from './demo-check-ins.js';
import { seedDemoBodies } from './demo-body.js';
import { removeDemoPartnerGyms, seedDemoPartnerGyms } from './demo-gyms.js';
import { seedDemoExercises } from './demo-exercises.js';
import { seedDemoWorkoutLogs, seedDemoWorkoutPlans } from './demo-workouts.js';
import { seedDemoClassPayments, seedDemoPayments } from './demo-payments.js';
import { seedDemoPastClasses } from './demo-attendance.js';
import { createClassAllowance } from './demo-class-allowance.js';

export const DEMO_EMAIL_DOMAIN = 'demo.gymflow.local';
// Every demo account uses this password, so you can log in as any of them.
export const DEMO_PASSWORD = 'demo1234';

// Basic = gym only (classesPerMonth 0); Premium = 10 group classes per membership month.
// `renamedFrom`: the plan's name before membership types existed – an existing plan with that name is renamed.
const DEMO_PLANS = [
  {
    name: 'Basic Monthly',
    description: 'Unlimited gym access 7 days a week. Group classes are not included.',
    durationMonths: 1,
    price: 1000,
    classesPerMonth: 0,
    isActive: true,
  },
  {
    name: 'Premium Monthly',
    renamedFrom: 'Monthly',
    description: 'Unlimited gym access 7 days a week and 10 group classes every month. Perfect to get started – no long commitment.',
    durationMonths: 1,
    price: 1500,
    classesPerMonth: 10,
    isActive: true,
  },
  {
    name: 'Basic 3 Months',
    description: 'Three months of unlimited gym access for a lower monthly price. Group classes are not included.',
    durationMonths: 3,
    price: 2700,
    classesPerMonth: 0,
    isActive: true,
  },
  {
    name: 'Premium 3 Months',
    renamedFrom: '3 Months',
    description: 'Unlimited gym access, 10 group classes every month and one free personal training session to set up your first workout plan.',
    durationMonths: 3,
    price: 4000,
    classesPerMonth: 10,
    isActive: true,
  },
  {
    name: 'Premium 12 Months',
    renamedFrom: '12 Months',
    description: 'Our best value: unlimited gym access, 10 group classes every month, a personal training session every 3 months and a free towel service.',
    durationMonths: 12,
    price: 14000,
    classesPerMonth: 10,
    isActive: true,
  },
  {
    name: 'Student (old offer)',
    description: 'Discounted monthly plan for students with a valid student card. No longer sold.',
    durationMonths: 1,
    price: 999.5,
    classesPerMonth: 10,
    isActive: false,
  },
];

// `avatar`: the picture each demo person chose (ids from src/utils/avatars.js); some keep their initials.
const DEMO_TRAINERS = [
  { firstName: 'Mert', lastName: 'Aydin', avatar: 'badge-dumbbell' },
  { firstName: 'Gizem', lastName: 'Erdem', avatar: 'lorelei-nala' },
];

// Each membership is described by the situation we want to show:
//   endsIn: N   → ends N days from today (negative = already ended)
//   startsIn: N → starts N days from today (an upcoming membership)
const DEMO_MEMBERS = [
  { firstName: 'Elif', lastName: 'Yilmaz', avatar: 'notionists-aneka', memberships: [{ plan: 'Premium 3 Months', endsIn: 50 }] },
  { firstName: 'Mehmet', lastName: 'Kaya', avatar: 'notionists-felix', memberships: [{ plan: 'Premium 12 Months', endsIn: 200 }] },
  { firstName: 'Ayse', lastName: 'Demir', avatar: 'lorelei-mia', memberships: [{ plan: 'Premium Monthly', endsIn: 12 }] },
  { firstName: 'Can', lastName: 'Ozturk', avatar: 'badge-bike', memberships: [{ plan: 'Basic Monthly', endsIn: 3 }] },
  { firstName: 'Deniz', lastName: 'Arslan', avatar: 'notionists-omar', memberships: [{ plan: 'Premium Monthly', endsIn: 0 }] }, // last day today
  { firstName: 'Zeynep', lastName: 'Sahin', avatar: 'lorelei-zeynep', memberships: [{ plan: 'Basic 3 Months', endsIn: 6 }] },
  { firstName: 'Burak', lastName: 'Celik', avatar: 'notionists-kaan', memberships: [{ plan: 'Premium Monthly', endsIn: -20 }] },
  {
    firstName: 'Emre',
    avatar: 'badge-flame',
    lastName: 'Aydin',
    memberships: [
      { plan: 'Student (old offer)', endsIn: -150 },
      { plan: 'Premium 3 Months', endsIn: -60 },
    ],
  },
  { firstName: 'Selin', lastName: 'Kara', memberships: [] },
  { firstName: 'Ece', lastName: 'Yildiz', memberships: [{ plan: 'Premium Monthly', startsIn: 5 }] },
  {
    // Renewed: the current membership ends soon, the next one is already booked.
    firstName: 'Ahmet',
    avatar: 'notionists-leo',
    lastName: 'Koc',
    memberships: [
      { plan: 'Premium Monthly', endsIn: 4 },
      { plan: 'Premium Monthly', startsIn: 5 },
    ],
  },
  {
    firstName: 'Merve',
    avatar: 'lorelei-sara',
    lastName: 'Polat',
    memberships: [
      { plan: 'Premium Monthly', endsIn: -90 },
      { plan: 'Premium 3 Months', endsIn: 30 },
    ],
  },
];

const demoEmail = (firstName) => `${firstName.toLowerCase()}@${DEMO_EMAIL_DOMAIN}`;
const isDemoUser = { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } };

// Demo data must never be created on a production system (known password!).
export function assertNotProduction(nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv === 'production') {
    throw new Error('Refusing to create demo data in production.');
  }
}

// The start date for a plan so that it ends on `endDate`, using the same end-date rule as the app
// (searches backwards day by day). Some end dates can never be reached: e.g. no monthly membership
// ends on 30 October (30 September → 29 October, 1 October → 31 October). Then the membership
// ends one day later, which is fine for demo data.
function startDateForEnd(endDate, durationMonths) {
  for (const target of [endDate, addDays(endDate, 1)]) {
    for (let daysBack = 27 * durationMonths; daysBack <= 32 * durationMonths; daysBack++) {
      const start = addDays(target, -daysBack);
      if (calculateEndDate(start, durationMonths).getTime() === target.getTime()) {
        return start;
      }
    }
  }
  throw new Error('No matching start date found');
}

function periodFor(spec, plan, today) {
  if (spec.startsIn !== undefined) {
    const start = addDays(today, spec.startsIn);
    return { startDate: start, endDate: calculateEndDate(start, plan.durationMonths) };
  }
  const end = addDays(today, spec.endsIn);
  return { startDate: startDateForEnd(end, plan.durationMonths), endDate: end };
}

// Deletes all demo accounts and the classes of demo trainers.
// Order matters: a trainer who still has classes cannot be deleted (RESTRICT), so classes go first.
// Memberships and bookings of demo members are deleted with them by the database (CASCADE).
// Real users and their data are never touched.
export async function removeDemoData(prisma) {
  await prisma.gymClass.deleteMany({ where: { trainer: isDemoUser } });
  const { count } = await prisma.user.deleteMany({ where: isDemoUser });
  await removeDemoPartnerGyms(prisma);
  return { removedUsers: count };
}

// Creates (or recreates with fresh dates) all demo data.
export async function seedDemoData(prisma, { today = todayInGym(), now = new Date() } = {}) {
  await removeDemoData(prisma);

  // Plans: reuse a plan with the same name if it already exists.
  const plans = {};
  for (const { renamedFrom, ...plan } of DEMO_PLANS) {
    // A plan from before membership types (e.g. "Monthly") becomes its Premium version, keeping its sales history.
    if (renamedFrom && !(await prisma.membershipPlan.findUnique({ where: { name: plan.name } }))) {
      await prisma.membershipPlan.updateMany({ where: { name: renamedFrom }, data: { name: plan.name } });
    }
    plans[plan.name] = await prisma.membershipPlan.upsert({
      where: { name: plan.name },
      // Existing demo plans get the latest description and type; price and status stay as the admin left them.
      update: { description: plan.description, classesPerMonth: plan.classesPerMonth },
      create: plan,
    });
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const trainers = {};
  for (const trainer of DEMO_TRAINERS) {
    const user = await prisma.user.create({
      data: { ...trainer, email: demoEmail(trainer.firstName), passwordHash, role: 'TRAINER' },
    });
    trainers[trainer.firstName] = user.id;
  }

  for (const member of DEMO_MEMBERS) {
    const user = await prisma.user.create({
      data: {
        firstName: member.firstName,
        lastName: member.lastName,
        avatar: member.avatar ?? null,
        email: demoEmail(member.firstName),
        passwordHash,
        role: 'MEMBER',
      },
    });

    for (const spec of member.memberships) {
      const plan = plans[spec.plan];
      await prisma.membership.create({
        data: { userId: user.id, planId: plan.id, price: plan.price, classesPerMonth: plan.classesPerMonth, ...periodFor(spec, plan, today) },
      });
    }
  }

  const members = await prisma.user.findMany({
    where: { ...isDemoUser, role: 'MEMBER' },
    include: { memberships: true },
    orderBy: { id: 'asc' },
  });
  // Past classes first: their bookings use up classes of the current membership month too.
  const allowance = createClassAllowance();
  const { pastClasses, noShows } = await seedDemoPastClasses(prisma, { today, trainers, members, allowance });
  const classes = await seedDemoClasses(prisma, { today, now, trainers, members, allowance });
  // Partner gyms first: some visits of Premium members happen there.
  const partnerGyms = await seedDemoPartnerGyms(prisma);
  const partnerGymIds = (await prisma.partnerGym.findMany({ select: { id: true }, orderBy: { id: 'asc' } })).map((gym) => gym.id);
  const checkIns = await seedDemoCheckIns(prisma, { today, now, members, staffId: trainers.Mert, partnerGymIds });
  const bodyCheckIns = await seedDemoBodies(prisma, { today, members });
  const exercises = await seedDemoExercises(prisma);
  const workoutPlans = await seedDemoWorkoutPlans(prisma, { members, trainerId: trainers.Mert });
  const workoutLogs = await seedDemoWorkoutLogs(prisma, { today });
  const payments = (await seedDemoPayments(prisma, { today, now, members })) + (await seedDemoClassPayments(prisma, { now, members }));

  return { plans: DEMO_PLANS.length, trainers: DEMO_TRAINERS.length, members: DEMO_MEMBERS.length, classes, checkIns, bodyCheckIns, partnerGyms, exercises, workoutPlans, workoutLogs, payments, pastClasses, noShows };
}
