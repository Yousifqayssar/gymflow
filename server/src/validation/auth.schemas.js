import { z } from 'zod';

// Emails are trimmed and lower-cased, so "Ali@Mail.com " and "ali@mail.com" are the same account.
const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email address'));

const name = (label) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be at most 50 characters`);

// Note: there is no "role" field. Public registration always creates a MEMBER,
// and validate() removes any extra fields a client sends.
export const registerSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes of a password, so we don't allow longer ones.
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  firstName: name('First name'),
  lastName: name('Last name'),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});
