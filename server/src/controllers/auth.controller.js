import * as authService from '../services/auth.service.js';

// POST /api/auth/register
// req.body has already been checked and cleaned by validate(registerSchema).
export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result); // 201 = Created
}

// POST /api/auth/login
export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

// GET /api/auth/me
// authenticate has already loaded the logged-in user into req.user.
export function me(req, res) {
  res.json({ user: req.user });
}
