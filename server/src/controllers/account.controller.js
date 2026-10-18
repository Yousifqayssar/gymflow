import * as accountService from '../services/account.service.js';

// PUT /api/account/avatar  (any logged-in user, only for themselves)
export async function updateAvatar(req, res) {
  const user = await accountService.updateAvatar(req.user.id, req.body.avatar);
  res.json({ user });
}
