import { Router } from 'express';
import { listUsers } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Every route in this file requires a logged-in Admin.
router.use(authenticate, authorize('ADMIN'));

router.get('/', listUsers);

export default router;
