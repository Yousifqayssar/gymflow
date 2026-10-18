import { Router } from 'express';
import { getMyMembership, getMyQrCode, getMyVisits, resetMyQrCode } from '../controllers/me.controller.js';
import { listMyBookings } from '../controllers/booking.controller.js';
import { getMyBody, recordMyBody } from '../controllers/body.controller.js';
import { listMyWorkoutPlans } from '../controllers/workoutPlan.controller.js';
import { validate } from '../middleware/validate.js';
import { bodyCheckInSchema } from '../validation/body.schemas.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

// Routes about the logged-in member's own data (no ids in the URLs: always "me").
const router = Router();

router.use(authenticate, authorize('MEMBER'));

router.get('/membership', getMyMembership);
router.get('/bookings', listMyBookings);
router.get('/qr', getMyQrCode);
router.post('/qr/reset', resetMyQrCode);
router.get('/visits', getMyVisits);
router.get('/body', getMyBody);
router.post('/body', validate(bodyCheckInSchema), recordMyBody);
router.get('/workout-plans', listMyWorkoutPlans);

export default router;
