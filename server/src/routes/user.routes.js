import { Router } from 'express';
import { createUser, listUsers } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema } from '../validation/user.schemas.js';

const router = Router();

// Every route in this file requires a logged-in Admin.
router.use(authenticate, authorize('ADMIN'));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);

export default router;
