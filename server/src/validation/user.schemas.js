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

// Membership filters for the member list.
// "active" means valid today, so it includes memberships that are expiring soon.
export const MEMBERSHIP_FILTERS = ['active', 'expiring', 'expired', 'upcoming', 'none'];

// Query string of GET /api/users, e.g. ?role=MEMBER&status=expiring&search=ali
export const listUsersQuerySchema = z.object({
  role: z.enum(['ADMIN', 'TRAINER', 'MEMBER'], { error: 'Unknown role' }).optional(),
  status: z.enum(MEMBERSHIP_FILTERS, { error: 'Unknown status filter' }).optional(),
  search: z.string().trim().max(100).optional(),
});
