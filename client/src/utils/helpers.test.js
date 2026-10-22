import { describe, expect, it } from 'vitest';
import { checkCard, detectBrand, formatCardNumber, formatExpiry, passesLuhn } from './cards.js';
import { planType } from './planType.js';
import { paymentItem, paymentItemDetail } from './paymentDisplay.js';

describe('cards', () => {
  it('recognises Visa and Mastercard, and nothing else', () => {
    expect(detectBrand('4242424242424242')).toBe('VISA');
    expect(detectBrand('5555555555554444')).toBe('MASTERCARD');
    expect(detectBrand('378282246310005')).toBeNull(); // American Express
  });

  it('checks the Luhn check digit (catches typos)', () => {
    expect(passesLuhn('4242424242424242')).toBe(true);
    expect(passesLuhn('4242424242424241')).toBe(false);
  });

  it('formats while typing', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatExpiry('1228')).toBe('12/28');
  });

  it('refuses an expired card, accepts one valid this month', () => {
    const now = new Date('2026-10-22');
    const card = { holderName: 'Elif Yilmaz', number: '4242 4242 4242 4242', cvc: '123' };
    expect(checkCard({ ...card, expiry: '09/26' }, now)).toEqual({ expiry: 'This card has expired' });
    expect(checkCard({ ...card, expiry: '10/26' }, now)).toEqual({});
  });
});

describe('planType', () => {
  it('0 classes per month = Basic (gym only), more = Premium', () => {
    expect(planType(0)).toEqual({ type: 'BASIC', label: 'Basic', detail: 'Gym only' });
    expect(planType(10)).toEqual({ type: 'PREMIUM', label: 'Premium', detail: '10 classes a month' });
    expect(planType(1).detail).toBe('1 class a month');
  });
});

describe('paymentDisplay', () => {
  it('names what a payment bought: a plan or a class', () => {
    expect(paymentItem({ kind: 'MEMBERSHIP', plan: { name: 'Premium Monthly' } })).toBe('Premium Monthly');
    expect(paymentItem({ kind: 'CLASS', gymClass: { title: 'Morning Yoga', startsAt: '2026-10-20T04:30:00.000Z' } })).toBe('Morning Yoga class');
    expect(paymentItem({ kind: 'CLASS', gymClass: null })).toBe('Class'); // the class was deleted later
    expect(paymentItemDetail({ kind: 'MEMBERSHIP', plan: { name: 'X' } })).toBeNull();
  });
});
