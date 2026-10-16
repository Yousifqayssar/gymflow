import { Router } from 'express';
import { getMyMembership } from '../controllers/me.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

// Routes about the logged-in user's own data.
const router = Router();

router.use(authenticate);

router.get('/membership', authorize('MEMBER'), getMyMembership);

export default router;
