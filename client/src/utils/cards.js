// Card helpers for the checkout form. They mirror the server's checks (server/src/services/cardGateway.js)
// so mistakes are shown while typing; the server still checks everything again.

export const digitsOnly = (text) => text.replace(/\D/g, '');

// Visa starts with 4; Mastercard with 51–55 or 2221–2720. Works on partial numbers too (for the logo).
export function detectBrand(digits) {
  if (digits.startsWith('4')) return 'VISA';
  const first2 = Number(digits.slice(0, 2));
  const first4 = Number(digits.slice(0, 4).padEnd(4, '0'));
  if (digits.length >= 2 && first2 >= 51 && first2 <= 55) return 'MASTERCARD';
  if (digits.length >= 2 && first4 >= 2221 && first4 <= 2720) return 'MASTERCARD';
  return null;
}

// "4242424242424242" → "4242 4242 4242 4242" (at most 16 digits)
export function formatCardNumber(text) {
  return digitsOnly(text)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

// "1228" → "12/28"
export function formatExpiry(text) {
  const digits = digitsOnly(text).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function passesLuhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return digits.length > 0 && sum % 10 === 0;
}

// Checks the form before sending; returns { field: message } (empty when everything is fine).
export function checkCard({ holderName, number, expiry, cvc }, now = new Date()) {
  const errors = {};
  const digits = digitsOnly(number);
  if (holderName.trim().length < 2) errors.holderName = 'Enter the name on the card';

  if (digits.length < 13) errors.number = 'Enter the card number';
  else if (!passesLuhn(digits)) errors.number = 'This card number is not valid – check for a typo';
  else if (!detectBrand(digits)) errors.number = 'Only Visa and Mastercard are accepted';

  const [month, year] = expiry.split('/').map(Number);
  if (!month || !year || month > 12 || expiry.length !== 5) errors.expiry = 'Use MM/YY, e.g. 12/28';
  else if (2000 + year < now.getFullYear() || (2000 + year === now.getFullYear() && month < now.getMonth() + 1)) errors.expiry = 'This card has expired';

  if (!/^\d{3}$/.test(cvc)) errors.cvc = '3 digits on the back';
  return errors;
}

// The server's field names (card.expYear …) → the form's field names.
export const SERVER_FIELDS = {
  'card.holderName': 'holderName',
  'card.number': 'number',
  'card.expMonth': 'expiry',
  'card.expYear': 'expiry',
  'card.cvc': 'cvc',
};

// Test cards shown on the checkout page (the gateway runs in test mode – no real money).
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Visa – paid' },
  { number: '5555 5555 5555 4444', label: 'Mastercard – paid' },
  { number: '4000 0000 0000 0002', label: 'Declined' },
  { number: '4000 0000 0000 9995', label: 'No funds' },
];
