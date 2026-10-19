import { Router } from 'express';
import { listPayments } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

// All payments of the gym, for the admin. (Members see their own under /api/me/payments.)
const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', listPayments);

export default router;
