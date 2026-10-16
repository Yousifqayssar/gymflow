import { Router } from 'express';
import { createUser, listUsers } from '../controllers/user.controller.js';
import { assignMembership, getMember, previewMembership } from '../controllers/membership.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema } from '../validation/user.schemas.js';
import { assignMembershipSchema } from '../validation/membership.schemas.js';

const router = Router();

// Every route in this file requires a logged-in Admin.
router.use(authenticate, authorize('ADMIN'));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);

router.get('/:id', getMember);
router.get('/:id/memberships/preview', previewMembership);
router.post('/:id/memberships', validate(assignMembershipSchema), assignMembership);

export default router;
