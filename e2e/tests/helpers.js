import { expect } from '@playwright/test';

// Logs in through the real login form.
export async function logIn(page, { email, password }) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

// A small API client for preparing a test (finding a suitable class, a member number …).
// The test itself then does everything through the screen, like a real user.
export async function apiAs(request, credentials) {
  const login = await request.post('/api/auth/login', { data: credentials });
  expect(login.ok()).toBeTruthy();
  const { token, user } = await login.json();
  const get = async (path) => (await request.get(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } })).json();
  return { user, get };
}

// The first upcoming class the user can book, whose booking quote matches `wanted`
// (e.g. (q) => !q.mustPay for a free booking, (q) => q.reason === 'BASIC_PLAN' for a paid one).
export async function findBookableClass(api, wanted) {
  const { classes } = await api.get('/classes');
  for (const gymClass of classes.filter((c) => !c.isCancelled && !c.hasStarted && !c.isBookedByMe && c.spotsLeft > 0)) {
    const { quote } = await api.get(`/classes/${gymClass.id}/booking-quote`);
    if (quote && wanted(quote)) return { gymClass, quote };
  }
  throw new Error('No suitable class in the demo data');
}

// "₺150.00" the way the website shows money.
export const money = (amount) => `₺${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// 4 → "GF-00004"
export const memberNumber = (id) => `GF-${String(id).padStart(5, '0')}`;
