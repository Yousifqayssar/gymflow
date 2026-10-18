import * as workoutPlanService from '../services/workoutPlan.service.js';
import { parseQuery } from '../middleware/validate.js';
import { listMembersQuerySchema, listWorkoutPlansQuerySchema } from '../validation/workoutPlan.schemas.js';
import { parseId } from '../utils/params.js';

// GET /api/workout-plans?memberId=  (Admin, Trainer)
export async function listWorkoutPlans(req, res) {
  const query = parseQuery(listWorkoutPlansQuerySchema, req.query);
  res.json({ plans: await workoutPlanService.listWorkoutPlans(query) });
}

// GET /api/workout-plans/:id  (staff, or the member it belongs to)
export async function getWorkoutPlan(req, res) {
  res.json({ plan: await workoutPlanService.getWorkoutPlan(parseId(req.params.id, 'Workout plan'), req.user) });
}

// POST /api/workout-plans  (Admin, Trainer)
export async function createWorkoutPlan(req, res) {
  res.status(201).json({ plan: await workoutPlanService.createWorkoutPlan(req.body, req.user) });
}

// PUT /api/workout-plans/:id  (the plan's author, or an admin)
export async function updateWorkoutPlan(req, res) {
  res.json({ plan: await workoutPlanService.updateWorkoutPlan(parseId(req.params.id, 'Workout plan'), req.body, req.user) });
}

// GET /api/me/workout-plans  (Member)
export async function listMyWorkoutPlans(req, res) {
  res.json({ plans: await workoutPlanService.listMyWorkoutPlans(req.user.id) });
}

// GET /api/members?search=  (Admin, Trainer)
export async function listMembersForStaff(req, res) {
  const query = parseQuery(listMembersQuerySchema, req.query);
  res.json({ members: await workoutPlanService.listMembersForStaff(query) });
}
