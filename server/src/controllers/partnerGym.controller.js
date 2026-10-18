import * as partnerGymService from '../services/partnerGym.service.js';
import { parseId } from '../utils/params.js';

// GET /api/partner-gyms  (any logged-in user)
export async function listPartnerGyms(req, res) {
  res.json({ gyms: await partnerGymService.listPartnerGyms() });
}

// POST /api/partner-gyms  (Admin)
export async function createPartnerGym(req, res) {
  res.status(201).json({ gym: await partnerGymService.createPartnerGym(req.body) });
}

// PUT /api/partner-gyms/:id  (Admin)
export async function updatePartnerGym(req, res) {
  res.json({ gym: await partnerGymService.updatePartnerGym(parseId(req.params.id, 'Partner gym'), req.body) });
}

// DELETE /api/partner-gyms/:id  (Admin)
export async function deletePartnerGym(req, res) {
  await partnerGymService.deletePartnerGym(parseId(req.params.id, 'Partner gym'));
  res.status(204).end();
}
