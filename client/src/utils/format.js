// Display helpers, so numbers and dates look the same on every page.

const CURRENCY = 'TRY';

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: CURRENCY,
  currencyDisplay: 'narrowSymbol', // "₺" instead of "TRY"
});

// The API sends prices as exact strings, e.g. "2500.00" → "₺2,500.00"
export function formatPrice(price) {
  return priceFormatter.format(Number(price));
}

const DATE_OPTIONS = { day: 'numeric', month: 'short', year: 'numeric' };
const dateFormatter = new Intl.DateTimeFormat('en-GB', DATE_OPTIONS);
// Calendar dates ("2026-10-16") are read as midnight UTC, so they must also be shown in UTC.
// Otherwise a viewer west of UTC would see the previous day.
const calendarDateFormatter = new Intl.DateTimeFormat('en-GB', { ...DATE_OPTIONS, timeZone: 'UTC' });

// "2026-10-16" (calendar date) or "2026-10-16T15:45:35.000Z" (moment in time) → "16 Oct 2026"
export function formatDate(value) {
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return (isCalendarDate ? calendarDateFormatter : dateFormatter).format(new Date(value));
}

// The readable member number shown on profiles (and later next to the QR code): 4 → "GF-00004".
// It comes from the database id, so it is unique and never changes.
export function formatMemberNumber(id) {
  return `GF-${String(id).padStart(5, '0')}`;
}

// 1 → "1 month", 3 → "3 months"
export function formatMonths(months) {
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}
