import { config as loadEnvFile } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Load the test settings (test database etc.) from .env.test.
// Because these values are set first, the normal .env cannot override them.
const testEnv = loadEnvFile({ path: '.env.test', quiet: true }).parsed ?? {};
Object.assign(process.env, testEnv);

export default defineConfig({
  test: {
    // We test a Node.js API, not browser code.
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env: testEnv,
    // Runs once before all tests: creates the test database and applies migrations.
    globalSetup: ['tests/setup/global-setup.js'],
    // All test files share one test database, so run them one after another
    // (otherwise one file could empty the tables while another is using them).
    fileParallelism: false,
  },
});
