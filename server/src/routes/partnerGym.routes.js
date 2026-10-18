import { Router } from 'express';
import { createPartnerGym, deletePartnerGym, listPartnerGyms, updatePartnerGym } from '../controllers/partnerGym.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { partnerGymSchema } from '../validation/partnerGym.schemas.js';

// Partner gyms: everyone who is logged in sees them on the map; only admins manage them.
const router = Router();

router.use(authenticate);

router.get('/', listPartnerGyms);
router.post('/', authorize('ADMIN'), validate(partnerGymSchema), createPartnerGym);
router.put('/:id', authorize('ADMIN'), validate(partnerGymSchema), updatePartnerGym);
router.delete('/:id', authorize('ADMIN'), deletePartnerGym);

export default router;
