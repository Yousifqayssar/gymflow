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

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// "2026-10-16T15:45:35.000Z" or "2026-10-16" → "16 Oct 2026"
export function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

// 1 → "1 month", 3 → "3 months"
export function formatMonths(months) {
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}
