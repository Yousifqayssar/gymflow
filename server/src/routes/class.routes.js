import { Router } from 'express';
import { cancelClass, createClass, getClass, listClasses, updateClass } from '../controllers/class.controller.js';
import { bookClass, cancelBooking } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createClassSchema, updateClassSchema } from '../validation/class.schemas.js';

const router = Router();

// Everyone must be logged in to see classes.
router.use(authenticate);

router.get('/', listClasses);
router.get('/:id', getClass);

// Creating and changing classes: admins and trainers. Whether a trainer may change
// a specific class (only their own) is checked in the service.
const staff = authorize('ADMIN', 'TRAINER');
router.post('/', staff, validate(createClassSchema), createClass);
router.patch('/:id', staff, validate(updateClassSchema), updateClass);
router.post('/:id/cancel', staff, cancelClass);

// Booking a spot: members only. All booking rules are checked in the booking service.
router.post('/:id/book', authorize('MEMBER'), bookClass);
router.delete('/:id/book', authorize('MEMBER'), cancelBooking);

export default router;
