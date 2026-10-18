import * as progressService from '../services/progress.service.js';
import { parseId } from '../utils/params.js';

// GET /api/me/progress  (Member)
export async function getMyProgress(req, res) {
  res.json(await progressService.getProgress(req.user.id));
}

// GET /api/members/:id/progress  (Admin, Trainer)
export async function getMemberProgress(req, res) {
  res.json(await progressService.getMemberProgress(parseId(req.params.id, 'Member')));
}
