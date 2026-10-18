// Demo workout plans written by trainer Mert, matching the members' body goals:
// Elif wants to lose weight (full body + cardio), Mehmet wants to build muscle (push / pull / legs).
const ex = (name, sets, reps, targetWeightKg, restSeconds, notes = null) => ({ name, sets, reps, targetWeightKg, restSeconds, notes });

const DEMO_PLANS = [
  {
    member: 'Elif',
    name: 'Fat loss – 3 days full body',
    notes: 'Keep the rest short and finish every session with 15 minutes of cardio.',
    days: [
      { name: 'Day A – Full body', exercises: [ex('Back squat', 3, 12, 30, 60), ex('Push-up', 3, 10, null, 60, 'On your knees is fine'), ex('Seated cable row', 3, 12, 25, 60), ex('Plank', 3, 1, null, 45, 'Hold 40 seconds')] },
      { name: 'Day B – Cardio + core', exercises: [ex('Rowing machine', 1, 1, null, 0, '20 minutes, steady'), ex('Kettlebell swing', 4, 15, 12, 45), ex('Russian twist', 3, 20, 6, 45)] },
      { name: 'Day C – Full body', exercises: [ex('Romanian deadlift', 3, 10, 30, 75), ex('Incline dumbbell press', 3, 12, 8, 60), ex('Lat pulldown', 3, 12, 30, 60), ex('Walking lunge', 3, 10, 6, 60)] },
    ],
  },
  {
    member: 'Mehmet',
    name: 'Muscle building – push / pull / legs',
    notes: 'Add 2.5 kg when you manage all reps of all sets.',
    days: [
      { name: 'Push', exercises: [ex('Bench press', 4, 8, 70, 120), ex('Overhead press', 3, 8, 40, 120), ex('Dumbbell lateral raise', 3, 12, 10, 60), ex('Triceps pushdown', 3, 12, 30, 60)] },
      { name: 'Pull', exercises: [ex('Deadlift', 3, 5, 110, 180), ex('Pull-up', 4, 8, null, 120), ex('Seated cable row', 3, 10, 60, 90), ex('Barbell curl', 3, 10, 30, 60)] },
      { name: 'Legs', exercises: [ex('Back squat', 4, 8, 90, 150), ex('Leg press', 3, 12, 160, 90), ex('Romanian deadlift', 3, 10, 70, 90), ex('Hanging knee raise', 3, 12, null, 60)] },
    ],
  },
];

export async function seedDemoWorkoutPlans(prisma, { members, trainerId }) {
  const exercises = await prisma.exercise.findMany({ select: { id: true, name: true } });
  const exerciseId = Object.fromEntries(exercises.map((e) => [e.name, e.id]));

  let count = 0;
  for (const plan of DEMO_PLANS) {
    const member = members.find((m) => m.firstName === plan.member);
    if (!member) continue;
    await prisma.workoutPlan.create({
      data: {
        memberId: member.id,
        authorId: trainerId,
        name: plan.name,
        notes: plan.notes,
        days: {
          create: plan.days.map((day, dayIndex) => ({
            name: day.name,
            position: dayIndex,
            exercises: {
              create: day.exercises.map((item, index) => ({
                exerciseId: exerciseId[item.name],
                position: index,
                sets: item.sets,
                reps: item.reps,
                targetWeightKg: item.targetWeightKg,
                restSeconds: item.restSeconds,
                notes: item.notes,
              })),
            },
          })),
        },
      },
    });
    count++;
  }
  return count;
}

// Six weeks of finished workouts for the members with a plan: three sessions a week, cycling
// through the plan's days, with the weights slowly going up – so the progress charts have a story.
const WEEKS = 6;
const SESSION_DAYS = [0, 2, 4]; // Monday, Wednesday, Friday of each week
const KG_PER_WEEK = 2.5;

export async function seedDemoWorkoutLogs(prisma, { today }) {
  const plans = await prisma.workoutPlan.findMany({
    where: { member: { email: { endsWith: '@demo.gymflow.local' } } },
    include: { days: { orderBy: { position: 'asc' }, include: { exercises: { orderBy: { position: 'asc' } } } } },
  });

  // Built in memory first, then written with two queries (all logs, then all sets): much faster than one by one.
  const logs = [];
  const setsPerLog = [];
  for (const plan of plans) {
    let session = 0;
    for (let week = WEEKS; week >= 1; week--) {
      for (const weekday of SESSION_DAYS) {
        const daysAgo = week * 7 - weekday;
        if (daysAgo < 1) continue;
        const day = plan.days[session % plan.days.length];
        session++;
        const weeksDone = WEEKS - week; // 0 in the first week, then 1, 2 …
        const performedAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000); // ~17:00 UTC
        const sets = day.exercises.flatMap((item) =>
          Array.from({ length: item.sets }, (_, i) => ({
            exerciseId: item.exerciseId,
            setNumber: i + 1,
            reps: Math.max(1, item.reps - (i === item.sets - 1 ? 1 : 0)), // the last set is the hardest
            weightKg: item.targetWeightKg === null ? null : Math.max(0, Number(item.targetWeightKg) - (WEEKS - 1 - weeksDone) * KG_PER_WEEK),
          })),
        );
        logs.push({ memberId: plan.memberId, planId: plan.id, dayId: day.id, dayName: day.name, performedAt, durationSeconds: 40 * 60 + (session % 4) * 5 * 60 });
        setsPerLog.push(sets);
      }
    }
  }

  const created = await prisma.workoutLog.createManyAndReturn({ data: logs, select: { id: true } });
  await prisma.workoutSet.createMany({ data: created.flatMap((log, i) => setsPerLog[i].map((set) => ({ ...set, logId: log.id }))) });
  return created.length;
}
