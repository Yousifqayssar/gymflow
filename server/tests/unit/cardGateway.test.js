import { describe, expect, it } from 'vitest';
import { chargeCard, cleanCardNumber, detectBrand, isExpired, newPaymentReference, passesLuhn } from '../../src/services/cardGateway.js';

describe('card checks', () => {
  it('removes spaces and dashes', () => {
    expect(cleanCardNumber('4242 4242-4242 4242')).toBe('4242424242424242');
  });

  it('recognises Visa and Mastercard (both Mastercard ranges), nothing else', () => {
    expect(detectBrand('4242424242424242')).toBe('VISA');
    expect(detectBrand('5555555555554444')).toBe('MASTERCARD');
    expect(detectBrand('2223003122003222')).toBe('MASTERCARD');
    expect(detectBrand('378282246310005')).toBeNull(); // American Express
    expect(detectBrand('6011111111111117')).toBeNull(); // Discover
  });

  it('runs the Luhn check that catches typos', () => {
    expect(passesLuhn('4242424242424242')).toBe(true);
    expect(passesLuhn('5555555555554444')).toBe(true);
    expect(passesLuhn('4242424242424241')).toBe(false); // one digit wrong
    expect(passesLuhn('')).toBe(false);
  });

  it('treats a card as valid until the end of its expiry month', () => {
    const today = new Date('2026-10-15T00:00:00Z');
    expect(isExpired(10, 2026, today)).toBe(false);
    expect(isExpired(9, 2026, today)).toBe(true);
    expect(isExpired(1, 2027, today)).toBe(false);
    expect(isExpired(12, 2025, today)).toBe(true);
  });
});

describe('chargeCard (test gateway)', () => {
  it('approves normal test cards and keeps only the brand and last 4 digits', () => {
    const result = chargeCard({ number: '5555 5555 5555 4444', cvc: '123' });

    expect(result).toEqual({ approved: true, brand: 'MASTERCARD', last4: '4444' });
  });

  it('declines the special test cards with a reason', () => {
    expect(chargeCard({ number: '4000000000000002' })).toMatchObject({ approved: false, last4: '0002', declineReason: expect.stringContaining('declined') });
    expect(chargeCard({ number: '4000000000009995' })).toMatchObject({ approved: false, declineReason: 'Insufficient funds on this card.' });
  });
});

describe('newPaymentReference', () => {
  it('makes short, readable, different codes', () => {
    const a = newPaymentReference();
    expect(a).toMatch(/^GF-[A-HJ-NP-Z2-9]{6}$/);
    expect(newPaymentReference()).not.toBe(a);
  });
});
