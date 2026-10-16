import * as userService from '../services/user.service.js';
import { parseQuery } from '../middleware/validate.js';
import { listUsersQuerySchema } from '../validation/user.schemas.js';
import { toPublicUser } from '../utils/publicUser.js';

// GET /api/users?role=MEMBER&search=ali  (Admin only)
export async function listUsers(req, res) {
  const filters = parseQuery(listUsersQuerySchema, req.query);
  const users = await userService.listUsers(filters);
  res.json({ users });
}

// POST /api/users  (Admin only) – create a Member or Trainer account
export async function createUser(req, res) {
  const user = await userService.createUserAccount(req.body);
  res.status(201).json({ user: toPublicUser(user) });
}
