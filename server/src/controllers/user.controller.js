import * as userService from '../services/user.service.js';

// GET /api/users  (Admin only)
export async function listUsers(req, res) {
  const users = await userService.listUsers();
  res.json({ users });
}
