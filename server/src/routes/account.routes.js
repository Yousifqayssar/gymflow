import { Router } from 'express';
import { updateAvatar } from '../controllers/account.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { avatarSchema } from '../validation/account.schemas.js';

// The logged-in user's own account settings – for every role (members, trainers and admins).
// (/api/me is only for members, because it is about memberships, QR codes and visits.)
const router = Router();

router.use(authenticate);

router.put('/avatar', validate(avatarSchema), updateAvatar);

export default router;
