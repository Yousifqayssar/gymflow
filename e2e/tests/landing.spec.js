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

test('from the login and join pages a visitor can go back to the front page', async ({ page }) => {
  await page.goto('/welcome');
  await page.getByRole('link', { name: 'Log in' }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole('link', { name: /^Back/ }).click();
  await expect(page).toHaveURL(/\/welcome$/);

  // The GymFlow logo also leads back.
  await page.goto('/register');
  await page.getByRole('link', { name: 'GymFlow front page' }).click();
  await expect(page).toHaveURL(/\/welcome$/);
});

test('in dark mode the closing Join button is readable, and the FAQ answers open', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/welcome');

  // Once this button had white text on a white background in dark mode; it must stay readable.
  const join = page.getByRole('link', { name: 'Join GymFlow' }).last();
  await join.scrollIntoViewIfNeeded();
  // Contrast ratio between text and background (WCAG formula); colours are turned into RGB with a canvas,
  // because the browser may report them as oklch().
  const contrast = await join.evaluate((el) => {
    const toRgb = (colour) => {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const luminance = (rgb) => {
      const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const style = getComputedStyle(el);
    const [a, b] = [luminance(toRgb(style.color)), luminance(toRgb(style.backgroundColor))].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);

  const question = page.getByText('Does my membership renew automatically?');
  await question.click();
  await expect(page.getByText(/A membership simply ends on its last day/)).toBeVisible();
});

test('a logged-in member who opens the landing page is taken into the app', async ({ page }) => {
  await logIn(page, demo('elif'));

  await page.goto('/welcome');

  await expect(page).not.toHaveURL(/\/welcome/);
});
