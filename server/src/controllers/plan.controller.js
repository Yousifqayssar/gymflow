import * as planService from '../services/plan.service.js';
import { parseId } from '../utils/params.js';

// GET /api/plans
export async function listPlans(req, res) {
  const plans = await planService.listPlans({ includeInactive: req.user.role === 'ADMIN' });
  res.json({ plans });
}

// POST /api/plans  (Admin)
export async function createPlan(req, res) {
  const plan = await planService.createPlan(req.body);
  res.status(201).json({ plan });
}

// PATCH /api/plans/:id  (Admin)
export async function updatePlan(req, res) {
  const plan = await planService.updatePlan(parseId(req.params.id, 'Plan'), req.body);
  res.json({ plan });
}
