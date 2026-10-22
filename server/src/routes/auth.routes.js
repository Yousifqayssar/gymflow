import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/security.js';
import { registerSchema, loginSchema } from '../validation/auth.schemas.js';

const router = Router();

// Both are rate-limited against password guessing (10 failed attempts per 15 minutes per address).
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, me);

export default router;
