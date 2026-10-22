import { test, expect } from '@playwright/test';
import { demo } from '../e2e-env.js';
import { logIn } from './helpers.js';

test('a logged-out visitor to the site root sees the public landing page, not the login form', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: /Train smarter/i })).toBeVisible();
  // The login form is not shown here.
  await expect(page.getByRole('textbox', { name: 'Password' })).not.toBeVisible();

  // Both plans and their real prices are shown.
  await expect(page.getByText('₺1,000')).toBeVisible();
  await expect(page.getByText('₺1,500')).toBeVisible();
});

test('the landing page leads to join and to log in', async ({ page }) => {
  await page.goto('/welcome');

  await page.getByRole('navigation', { name: 'Page sections' }).getByRole('link', { name: 'Plans' }).click();
  await page.getByRole('link', { name: 'Join with Premium' }).click();
  await expect(page).toHaveURL(/\/register$/);

  await page.goto('/welcome');
  await page.getByRole('link', { name: 'Log in' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
});

test('a logged-in member who opens the landing page is taken into the app', async ({ page }) => {
  await logIn(page, demo('elif'));

  await page.goto('/welcome');

  await expect(page).not.toHaveURL(/\/welcome/);
});
