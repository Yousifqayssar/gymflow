import crypto from 'node:crypto';

// Our built-in TEST payment gateway. It behaves like the test mode of a real payment company:
// no real money moves, and special test card numbers trigger a decline.
// A real gateway would be called here instead; the rest of the app would not change.

// Test cards that the "bank" refuses, with the message the member sees.
// Every other valid Visa / Mastercard number is approved (e.g. 4242 4242 4242 4242, 5555 5555 5555 4444).
export const DECLINING_TEST_CARDS = {
  '4000000000000002': 'Your card was declined. Please use another card.',
  '4000000000009995': 'Insufficient funds on this card.',
};

// "4242 4242-4242 4242" → "4242424242424242"
export function cleanCardNumber(number) {
  return String(number).replace(/[\s-]/g, '');
}

// Visa starts with 4; Mastercard with 51–55 or 2221–2720. We only accept these two.
export function detectBrand(number) {
  if (/^4\d{12}(\d{3}){0,2}$/.test(number)) return 'VISA';
  if (/^\d{16}$/.test(number)) {
    const first2 = Number(number.slice(0, 2));
    const first4 = Number(number.slice(0, 4));
    if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) return 'MASTERCARD';
  }
  return null;
}

// The Luhn check that every card number passes; it catches typos like a swapped or wrong digit.
export function passesLuhn(number) {
  let sum = 0;
  for (let i = 0; i < number.length; i += 1) {
    let digit = Number(number[number.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return number.length > 0 && sum % 10 === 0;
}

// A card is valid up to and including its expiry month.
export function isExpired(expMonth, expYear, today) {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;
  return expYear < year || (expYear === year && expMonth < month);
}

// "Sends" the charge to the bank. The card has already been validated (number, expiry, CVC).
// Returns only what we may keep: the brand and the last 4 digits – never the full number or the CVC.
export function chargeCard(card) {
  const number = cleanCardNumber(card.number);
  const result = { brand: detectBrand(number), last4: number.slice(-4) };
  const declineReason = DECLINING_TEST_CARDS[number];
  return declineReason ? { ...result, approved: false, declineReason } : { ...result, approved: true };
}

// Receipt code like "GF-7K2Q9X" (no 0/O or 1/I, so it's easy to read out loud).
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newPaymentReference() {
  const bytes = crypto.randomBytes(6);
  return `GF-${Array.from(bytes, (b) => REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length]).join('')}`;
}
