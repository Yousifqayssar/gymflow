import * as bodyService from '../services/body.service.js';
import { parseId } from '../utils/params.js';

// GET /api/me/body  (Member)
export async function getMyBody(req, res) {
  res.json(await bodyService.getMyBody(req.user.id));
}

// POST /api/me/body  (Member)
export async function recordMyBody(req, res) {
  res.status(201).json(await bodyService.recordMyBody(req.user.id, req.body));
}

// GET /api/members/:id/body  (Admin, Trainer)
export async function getMemberBody(req, res) {
  res.json(await bodyService.getMemberBody(parseId(req.params.id, 'Member')));
}
