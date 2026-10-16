import { z } from 'zod';
import { emailField, nameField, newPasswordField } from './auth.schemas.js';

// Admins can create Member and Trainer accounts, but not other Admins:
// Admin accounts only come from the seed script.
export const createUserSchema = z.object({
  email: emailField,
  password: newPasswordField,
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  role: z.enum(['MEMBER', 'TRAINER'], { error: 'Role must be MEMBER or TRAINER' }),
});

// Query string of GET /api/users, e.g. ?role=MEMBER&search=ali
export const listUsersQuerySchema = z.object({
  role: z.enum(['ADMIN', 'TRAINER', 'MEMBER'], { error: 'Unknown role' }).optional(),
  search: z.string().trim().max(100).optional(),
});
