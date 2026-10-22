import { test, expect } from '@playwright/test';
import { demo } from '../e2e-env.js';
import { logIn } from './helpers.js';

// Runs in the "phone" project (Pixel 7 screen, touch): the app-style layout.
test('on a phone the member uses the bottom tab bar and the "More" sheet', async ({ page }) => {
  await logIn(page, demo('elif'));

  const tabBar = page.getByRole('navigation', { name: 'Main' });
  await expect(tabBar).toBeVisible();
  for (const tab of ['Home', 'Classes', 'My QR', 'Workouts']) {
    await expect(tabBar.getByRole('link', { name: tab })).toBeVisible();
  }

  await tabBar.getByRole('link', { name: 'My QR' }).click();
  await expect(page).toHaveURL(/\/my-qr$/);
  await expect(page.getByText('Check in at the entrance')).toBeVisible();

  await tabBar.getByRole('button', { name: 'More' }).click();
  const sheet = page.getByRole('dialog', { name: 'More' });
  // The closed sheet stays in the page, moved off-screen and inert (unreachable); open = not inert.
  await expect(sheet).not.toHaveAttribute('inert');
  await sheet.getByRole('link', { name: 'Rewards' }).click();

  await expect(page).toHaveURL(/\/rewards$/);
  await expect(sheet).toHaveAttribute('inert', '');
});
