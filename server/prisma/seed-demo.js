// Command-line wrapper for the demo data.
//   npm run db:seed:demo               → create (or refresh) the demo data
//   npm run db:seed:demo -- --remove   → delete all demo accounts again
import { prisma } from '../src/lib/prisma.js';
import { assertNotProduction, DEMO_EMAIL_DOMAIN, DEMO_PASSWORD, removeDemoData, seedDemoData } from './demo-data.js';

const remove = process.argv.includes('--remove');

try {
  assertNotProduction();

  if (remove) {
    const { removedUsers } = await removeDemoData(prisma);
    console.log(`Removed ${removedUsers} demo accounts.`);
  } else {
    const result = await seedDemoData(prisma);
    console.log(
      `Demo data ready: ${result.plans} plans, ${result.trainers} trainers, ${result.members} members, ` +
        `${result.classes} classes, ${result.checkIns} check-ins, ${result.bodyCheckIns} body check-ins, ${result.partnerGyms} partner gyms, ${result.exercises} exercises, ${result.workoutPlans} workout plans.`,
    );
    console.log(`Log in as any demo user, e.g. elif@${DEMO_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
