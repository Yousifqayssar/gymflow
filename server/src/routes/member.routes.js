import { Router } from 'express';
import { getMemberBody } from '../controllers/body.controller.js';
import { listMembersForStaff } from '../controllers/workoutPlan.controller.js';
import { listMemberWorkouts } from '../controllers/workoutLog.controller.js';
import { getMemberProgress } from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

// Information about members that trainers may see too (they use it to plan workouts).
// Managing members (accounts, memberships) stays admin-only in user.routes.js.
const router = Router();

router.use(authenticate, authorize('ADMIN', 'TRAINER'));

router.get('/', listMembersForStaff);
router.get('/:id/body', getMemberBody);
router.get('/:id/workouts', listMemberWorkouts);
router.get('/:id/progress', getMemberProgress);

export default router;
