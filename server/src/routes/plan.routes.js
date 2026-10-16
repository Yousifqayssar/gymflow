import { Router } from 'express';
import { createPlan, listPlans, updatePlan } from '../controllers/plan.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createPlanSchema, updatePlanSchema } from '../validation/plan.schemas.js';

const router = Router();

// Everyone must be logged in; only Admins can create or change plans.
router.use(authenticate);

router.get('/', listPlans);
router.post('/', authorize('ADMIN'), validate(createPlanSchema), createPlan);
router.patch('/:id', authorize('ADMIN'), validate(updatePlanSchema), updatePlan);

export default router;
