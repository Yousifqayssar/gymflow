import { getMemberWithMemberships } from '../services/membership.service.js';

// GET /api/me/membership  (Member)
// There is no id in the URL: the member is always the one from the login token,
// so a member can never ask for somebody else's data.
export async function getMyMembership(req, res) {
  const { status, currentMembership, memberships } = await getMemberWithMemberships(req.user.id);
  res.json({ status, currentMembership, memberships });
}
