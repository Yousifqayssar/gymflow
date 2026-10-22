import { test, expect } from '@playwright/test';
import { admin, demo } from '../e2e-env.js';
import { logIn } from './helpers.js';

test('the website is served with the security headers', async ({ page }) => {
  const response = await page.goto('/login');

  expect(response.headers()['content-security-policy']).toContain("default-src 'self'");
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('a wrong password is refused with a clear message', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(demo('elif').email);
  await page.getByRole('textbox', { name: 'Password' }).fill('not-my-password');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('a logged-out admin who opens Payments logs in and comes back to Payments', async ({ page }) => {
  await page.goto('/payments');
  await expect(page).toHaveURL(/\/login/);

  await page.getByRole('textbox', { name: 'Email' }).fill(admin().email);
  await page.getByRole('textbox', { name: 'Password' }).fill(admin().password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/payments$/);
  await expect(page.getByRole('heading', { name: 'Payments', level: 1 })).toBeVisible();
  await expect(page.getByText('Revenue this month')).toBeVisible();
});

test('a member cannot open admin pages', async ({ page }) => {
  await logIn(page, demo('elif'));

  await page.goto('/payments');

  await expect(page.getByRole('heading', { name: 'Payments', level: 1 })).not.toBeVisible();
});
