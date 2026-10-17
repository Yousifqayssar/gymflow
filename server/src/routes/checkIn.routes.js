import { Router } from 'express';
import { checkIn, listToday } from '../controllers/checkIn.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { checkInSchema } from '../validation/checkIn.schemas.js';

const router = Router();

// Only gym staff check members in; members cannot check themselves in.
router.use(authenticate, authorize('ADMIN', 'TRAINER'));

router.post('/', validate(checkInSchema), checkIn);
router.get('/today', listToday);

export default router;
