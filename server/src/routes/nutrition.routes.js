import { Router } from 'express';
import { analyzeMeal } from '../controllers/nutrition.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { analyzeMealSchema } from '../validation/nutrition.schemas.js';

// Food photo analysis with Google Gemini, for every logged-in user.
const router = Router();

router.post('/analyze', authenticate, validate(analyzeMealSchema), analyzeMeal);

export default router;
