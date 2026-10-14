// Seed script: puts the initial data into the database.
// Run with:  npm run db:seed
// For now it creates the first Admin account; demo data is added in Stage 5.
import { z } from 'zod';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/utils/password.js';

// The admin's login comes from .env, so no password is ever written in the code.
const seedEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
  SEED_ADMIN_PASSWORD: z.string().min(8, 'SEED_ADMIN_PASSWORD must be at least 8 characters'),
});

async function seedAdmin() {
  const result = seedEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Cannot seed the admin account:\n${z.prettifyError(result.error)}`);
  }
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = result.data;

  // upsert = "update if it exists, otherwise insert".
  // Running the seed twice therefore never creates a duplicate admin,
  // and it never overwrites a password the admin may have changed.
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      passwordHash: await hashPassword(password),
      firstName: 'Gym',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log(`Admin account ready: ${admin.email}`);
}

try {
  await seedAdmin();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
