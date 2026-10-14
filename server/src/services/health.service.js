import { prisma } from '../lib/prisma.js';

// Returns true if the database answers a trivial query, false otherwise.
// We catch the error on purpose: a down database is a health *result*, not a crash.
export async function isDatabaseReachable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}
