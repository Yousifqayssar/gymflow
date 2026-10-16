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

// 1 → "1 month", 3 → "3 months"
export function formatMonths(months) {
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}
