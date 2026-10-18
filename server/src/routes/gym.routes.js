import { Router } from 'express';
import { getStats } from '../controllers/gym.controller.js';
import { authenticate } from '../middleware/authenticate.js';

// Information about the gym itself, for every logged-in user.
const router = Router();

router.get('/stats', authenticate, getStats);

export default router;
