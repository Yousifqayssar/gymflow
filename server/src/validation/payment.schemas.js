import { z } from 'zod';
import { cleanCardNumber, detectBrand, isExpired, passesLuhn } from '../services/cardGateway.js';
import { todayInGym } from '../utils/dates.js';

const planId = z.coerce.number({ error: 'Choose a plan' }).int('Choose a plan').positive('Choose a plan');

// The card as typed by the member. Messages never repeat the number itself.
const cardSchema = z
  .object({
    number: z
      .string({ error: 'Enter the card number' })
      .transform(cleanCardNumber)
      .refine((n) => /^\d{13,19}$/.test(n), 'Enter the card number')
      .refine((n) => passesLuhn(n), 'This card number is not valid – check for a typo')
      .refine((n) => detectBrand(n) !== null, 'Only Visa and Mastercard are accepted'),
    expMonth: z.coerce.number({ error: 'Enter the expiry month' }).int().min(1, 'Month must be 01–12').max(12, 'Month must be 01–12'),
    // Two-digit years ("28") are turned into 2028.
    expYear: z.coerce
      .number({ error: 'Enter the expiry year' })
      .int()
      .transform((y) => (y < 100 ? 2000 + y : y))
      .refine((y) => y >= 2000 && y <= 2100, 'Enter a valid year'),
    cvc: z.string({ error: 'Enter the security code' }).regex(/^\d{3}$/, 'The security code is the 3 digits on the back'),
    holderName: z.string({ error: 'Enter the name on the card' }).trim().min(2, 'Enter the name on the card').max(60, 'Name is too long'),
  })
  .refine((card) => !isExpired(card.expMonth, card.expYear, todayInGym()), { message: 'This card has expired', path: ['expYear'] });

// Body of POST /api/me/checkout
// checkoutId: a random id the page creates once per checkout, so the same payment is never charged twice.
export const checkoutSchema = z.object({ planId, checkoutId: z.uuid({ error: 'Checkout id is missing' }), card: cardSchema });

// Body of POST /api/classes/:id/book-and-pay (paying for one class)
export const classCheckoutSchema = z.object({ checkoutId: z.uuid({ error: 'Checkout id is missing' }), card: cardSchema });

// Query of GET /api/me/membership/preview?planId=3
export const memberPreviewQuerySchema = z.object({ planId });

// Query of GET /api/payments (Admin)
export const listPaymentsQuerySchema = z.object({
  status: z.enum(['PAID', 'DECLINED', 'REFUNDED']).optional().or(z.literal('').transform(() => undefined)),
  userId: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
});
