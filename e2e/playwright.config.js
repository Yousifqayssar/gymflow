import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './e2e-env.js';

// End-to-end tests for GymFlow. Run from this folder:  npm test
export default defineConfig({
  testDir: './tests',
  // The tests share one database and change it (bookings, payments), so they run one after another.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    // The Chrome that is already installed – no extra browser download.
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' }, testIgnore: /phone/ },
    { name: 'phone', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /phone/ },
  ],
  webServer: {
    command: 'node start-app.js',
    url: `${BASE_URL}/api/health`,
    // Always a fresh app with fresh demo data, so every run starts from the same state.
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'pipe',
  },
});
