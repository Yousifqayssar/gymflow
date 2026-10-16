import { z } from 'zod';

// Field rules shared by every form that creates or identifies a user.

// Emails are trimmed and lower-cased, so "Ali@Mail.com " and "ali@mail.com" are the same account.
export const emailField = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email address'));

// bcrypt only uses the first 72 bytes of a password, so we don't allow longer ones.
export const newPasswordField = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const nameField = (label) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be at most 50 characters`);

// Note: there is no "role" field. Public registration always creates a MEMBER,
// and validate() removes any extra fields a client sends.
export const registerSchema = z.object({
  email: emailField,
  password: newPasswordField,
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});
