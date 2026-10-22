import { test, expect } from '@playwright/test';
import { demo } from '../e2e-env.js';
import { apiAs, logIn, memberNumber } from './helpers.js';

test('a trainer checks members in by member number', async ({ page, request }) => {
  const mehmet = (await apiAs(request, demo('mehmet'))).user; // Premium 12 Months: valid membership
  const burak = (await apiAs(request, demo('burak'))).user; // membership ended 20 days ago

  await logIn(page, demo('mert'));
  await page.goto('/check-in');
  const numberField = page.getByRole('textbox', { name: 'Member number' });
  const checkIn = page.getByRole('button', { name: 'Check in' });

  await numberField.fill(memberNumber(mehmet.id));
  await checkIn.click();
  await expect(page.getByText('Welcome, Mehmet!')).toBeVisible();
  // The demo data may already contain a visit today; either way the member is in.
  await expect(page.getByText(/^(Checked in|Already checked in today)$/)).toBeVisible();

  // A second scan the same day gives no extra points.
  await numberField.fill(memberNumber(mehmet.id));
  await checkIn.click();
  await expect(page.getByText('Already checked in today')).toBeVisible();

  // A member whose membership has ended is refused, with the reason.
  await numberField.fill(memberNumber(burak.id));
  await checkIn.click();
  await expect(page.getByText('Entry refused')).toBeVisible();
  await expect(page.getByText(/expired/i).first()).toBeVisible();
});
