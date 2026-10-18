import { Router } from 'express';
import { createWorkoutPlan, getWorkoutPlan, listWorkoutPlans, updateWorkoutPlan } from '../controllers/workoutPlan.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { workoutPlanSchema } from '../validation/workoutPlan.schemas.js';

// Workout plans: trainers and admins write them; a member may open their own plan
// (their list is GET /api/me/workout-plans).
const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'TRAINER'), listWorkoutPlans);
router.get('/:id', getWorkoutPlan);
router.post('/', authorize('ADMIN', 'TRAINER'), validate(workoutPlanSchema), createWorkoutPlan);
router.put('/:id', authorize('ADMIN', 'TRAINER'), validate(workoutPlanSchema), updateWorkoutPlan);

export default router;
