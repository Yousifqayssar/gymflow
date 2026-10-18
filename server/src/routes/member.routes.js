import { Router } from 'express';
import { getMemberBody } from '../controllers/body.controller.js';
import { listMembersForStaff } from '../controllers/workoutPlan.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

// Information about members that trainers may see too (they use it to plan workouts).
// Managing members (accounts, memberships) stays admin-only in user.routes.js.
const router = Router();

router.use(authenticate, authorize('ADMIN', 'TRAINER'));

router.get('/', listMembersForStaff);
router.get('/:id/body', getMemberBody);

export default router;
