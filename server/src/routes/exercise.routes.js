import { Router } from 'express';
import { createExercise, listExercises, updateExercise } from '../controllers/exercise.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { exerciseSchema } from '../validation/exercise.schemas.js';

// The exercise library: everyone reads it (members see exercises in their plans),
// trainers and admins add and edit exercises. There is no delete: deactivate instead.
const router = Router();

router.use(authenticate);

router.get('/', listExercises);
router.post('/', authorize('ADMIN', 'TRAINER'), validate(exerciseSchema), createExercise);
router.put('/:id', authorize('ADMIN', 'TRAINER'), validate(exerciseSchema), updateExercise);

export default router;
