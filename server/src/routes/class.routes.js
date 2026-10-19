import { Router } from 'express';
import { cancelClass, createClass, getClass, listClasses, updateClass } from '../controllers/class.controller.js';
import { bookAndPay, bookClass, cancelBooking, getBookingQuote } from '../controllers/booking.controller.js';
import { classCheckoutSchema } from '../validation/payment.schemas.js';
import { attendClass, getAttendance, markAttendance } from '../controllers/attendance.controller.js';
import { attendSchema, markAttendanceSchema } from '../validation/attendance.schemas.js';
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
// Paying per class: Basic members, and Premium members with no classes left this month (with a discount).
router.get('/:id/booking-quote', authorize('MEMBER'), getBookingQuote);
router.post('/:id/book-and-pay', authorize('MEMBER'), validate(classCheckoutSchema), bookAndPay);

// Attendance: the trainer shows a changing QR, members who booked scan it (no-shows lose points).
// Whether a trainer may take attendance for a class (only their own) is checked in the service.
router.get('/:id/attendance', staff, getAttendance);
router.put('/:id/attendance/:memberId', staff, validate(markAttendanceSchema), markAttendance);
router.post('/:id/attend', authorize('MEMBER'), validate(attendSchema), attendClass);

export default router;
