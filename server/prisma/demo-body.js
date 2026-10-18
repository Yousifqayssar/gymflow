import { addDays } from '../src/utils/dates.js';

// Monthly body check-ins for some demo members, oldest weight first, one month (30 days) apart.
// `lastDaysAgo`: how long ago the latest check-in was – over 30 days means the reminder shows.
// Members not listed here have no body details yet (to show the "Add my details" state).
const DEMO_BODIES = {
  Elif: { heightCm: 165, goal: 'LOSE_WEIGHT', targetWeightKg: 62, weights: [68, 67.2, 66.5, 66, 65.1], lastDaysAgo: 35 },
  Mehmet: { heightCm: 182, goal: 'BUILD_MUSCLE', targetWeightKg: 80, weights: [74, 75.2, 76, 77.1, 78], lastDaysAgo: 10 },
  Ayse: { heightCm: 160, goal: 'GET_FIT', targetWeightKg: null, weights: [58, 57.5, 57.8], lastDaysAgo: 5 },
  Can: { heightCm: 175, goal: 'IMPROVE_ENDURANCE', targetWeightKg: null, weights: [80, 79, 78.4], lastDaysAgo: 20 },
  Zeynep: { heightCm: 170, goal: 'STAY_HEALTHY', targetWeightKg: null, weights: [63.5], lastDaysAgo: 40 },
};

export async function seedDemoBodies(prisma, { today, members }) {
  const data = [];
  for (const member of members) {
    const body = DEMO_BODIES[member.firstName];
    if (!body) continue;
    body.weights.forEach((weightKg, index) => {
      const monthsBeforeLatest = body.weights.length - 1 - index;
      data.push({
        memberId: member.id,
        recordedOn: addDays(today, -(body.lastDaysAgo + monthsBeforeLatest * 30)),
        heightCm: body.heightCm,
        weightKg,
        goal: body.goal,
        targetWeightKg: body.targetWeightKg,
      });
    });
  }
  await prisma.bodyCheckIn.createMany({ data });
  return data.length;
}
