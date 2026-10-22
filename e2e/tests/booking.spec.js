// The class page has the booking panel twice: a card (desktop) and a bar (phones); the hidden one is
// filtered out with { visible: true }.
import { test, expect } from '@playwright/test';
import { demo } from '../e2e-env.js';
import { apiAs, findBookableClass, logIn, money } from './helpers.js';

test('a Premium member books a class with an included class and cancels it again', async ({ page, request }) => {
  const elif = await apiAs(request, demo('elif'));
  const { gymClass } = await findBookableClass(elif, (quote) => !quote.mustPay);
  const before = (await elif.get('/me/class-balance')).balance.left;

  await logIn(page, demo('elif'));
  await page.goto(`/classes/${gymClass.id}`);
  await page.getByRole('button', { name: 'Book this class' }).click();

  await expect(page.getByText(`You're booked for ${gymClass.title}!`)).toBeVisible();
  await expect(page.getByText("You're booked", { exact: true }).filter({ visible: true })).toBeVisible();
  expect((await elif.get('/me/class-balance')).balance.left).toBe(before - 1);

  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await page.getByRole('button', { name: 'Yes, cancel' }).click();

  await expect(page.getByText('Your booking was cancelled')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Book this class' })).toBeVisible();
  expect((await elif.get('/me/class-balance')).balance.left).toBe(before);
});

test('a Basic member pays for a single class by card, then cancels and gets a refund', async ({ page, request }) => {
  const zeynep = await apiAs(request, demo('zeynep'));
  const { gymClass, quote } = await findBookableClass(zeynep, (q) => q.reason === 'BASIC_PLAN');
  const price = money(quote.price);

  await logIn(page, demo('zeynep'));
  await page.goto(`/classes/${gymClass.id}`);
  await expect(page.getByText(/your Basic plan is gym only/).filter({ visible: true })).toBeVisible();

  // First try: a declined test card – nothing is booked.
  await page.getByRole('button', { name: `Book & pay ${price}` }).click();
  await page.getByRole('button', { name: /0002/ }).click();
  await page.getByRole('button', { name: `Pay ${price}`, exact: true }).click();
  await expect(page.getByText('Payment failed')).toBeVisible();

  // Second try: the Visa test card that is approved.
  await page.getByRole('button', { name: /4242/ }).click();
  await page.getByRole('button', { name: `Pay ${price}`, exact: true }).click();
  await expect(page.getByText(`Paid ${price} – you're booked for ${gymClass.title}!`)).toBeVisible();
  await expect(page.getByText('· paid by card').filter({ visible: true })).toBeVisible();

  // The receipts: one declined attempt and one paid class.
  const { payments } = await zeynep.get('/me/payments');
  const forThisClass = payments.filter((p) => p.gymClass?.id === gymClass.id);
  expect(forThisClass.map((p) => p.status).sort()).toEqual(['DECLINED', 'PAID']);

  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await expect(page.getByText(/the money goes back to your card/)).toBeVisible();
  await page.getByRole('button', { name: 'Yes, cancel' }).click();
  await expect(page.getByText(`Booking cancelled – ${price} refunded to your card`)).toBeVisible();
});
