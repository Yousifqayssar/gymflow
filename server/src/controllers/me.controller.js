import { getMemberWithMemberships } from '../services/membership.service.js';
import * as meService from '../services/me.service.js';

// GET /api/me/membership  (Member)
// There is no id in the URL: the member is always the one from the login token,
// so a member can never ask for somebody else's data.
export async function getMyMembership(req, res) {
  const { status, currentMembership, memberships } = await getMemberWithMemberships(req.user.id);
  res.json({ status, currentMembership, memberships });
}

// GET /api/me/qr  (Member)
export async function getMyQrCode(req, res) {
  res.json(await meService.getMyQrCode(req.user.id));
}

// POST /api/me/qr/reset  (Member)
export async function resetMyQrCode(req, res) {
  res.json(await meService.resetMyQrCode(req.user.id));
}

// GET /api/me/visits  (Member)
export async function getMyVisits(req, res) {
  res.json(await meService.getMyVisits(req.user.id));
}
