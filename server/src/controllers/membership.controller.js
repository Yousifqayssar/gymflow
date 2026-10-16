import * as membershipService from '../services/membership.service.js';
import { parseQuery } from '../middleware/validate.js';
import { previewMembershipQuerySchema } from '../validation/membership.schemas.js';
import { parseId } from '../utils/params.js';

// GET /api/users/:id  (Admin) – a member with their membership history
export async function getMember(req, res) {
  const result = await membershipService.getMemberWithMemberships(parseId(req.params.id, 'User'));
  res.json(result);
}

// GET /api/users/:id/memberships/preview?planId=1&startDate=2026-11-01  (Admin)
export async function previewMembership(req, res) {
  const input = parseQuery(previewMembershipQuerySchema, req.query);
  const preview = await membershipService.previewMembership(parseId(req.params.id, 'User'), input);
  res.json({ preview });
}

// POST /api/users/:id/memberships  (Admin)
export async function assignMembership(req, res) {
  const membership = await membershipService.assignMembership(parseId(req.params.id, 'User'), req.body);
  res.status(201).json({ membership });
}
