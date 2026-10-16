import * as userService from '../services/user.service.js';
import { parseQuery } from '../middleware/validate.js';
import { listUsersQuerySchema } from '../validation/user.schemas.js';
import { toPublicUser } from '../utils/publicUser.js';

// GET /api/users?role=MEMBER&status=expiring&search=ali  (Admin only)
// Returns { users } and, for members, { counts } per membership filter.
export async function listUsers(req, res) {
  const filters = parseQuery(listUsersQuerySchema, req.query);
  const result = await userService.listUsers(filters);
  res.json(result);
}

// POST /api/users  (Admin only) – create a Member or Trainer account
export async function createUser(req, res) {
  const user = await userService.createUserAccount(req.body);
  res.status(201).json({ user: toPublicUser(user) });
}
