import { Router } from 'express';
import { getMyMembership, getMyQrCode, getMyVisits, resetMyQrCode } from '../controllers/me.controller.js';
import { listMyBookings } from '../controllers/booking.controller.js';
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

export default router;
