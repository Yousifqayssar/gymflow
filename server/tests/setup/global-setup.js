import { execSync } from 'node:child_process';
import { assertTestDatabase } from './test-env.js';

// Runs ONCE before all test files.
// Creates the test database if needed and applies all migrations to it,
// so the tables always match the current Prisma schema.
export default function globalSetup() {
  assertTestDatabase();

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}
