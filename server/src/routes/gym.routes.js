import { Router } from 'express';
import { getAdminDashboard, getStats } from '../controllers/gym.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

// Information about the gym itself, for every logged-in user.
const router = Router();

router.get('/stats', authenticate, getStats);
// The admin dashboard numbers (revenue, attendance) are for admins only.
router.get('/admin-dashboard', authenticate, authorize('ADMIN'), getAdminDashboard);

export default router;
