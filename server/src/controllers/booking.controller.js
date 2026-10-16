import * as bookingService from '../services/booking.service.js';
import { parseId } from '../utils/params.js';

// POST /api/classes/:id/book  (Member)
export async function bookClass(req, res) {
  const gymClass = await bookingService.bookClass(parseId(req.params.id, 'Class'), req.user);
  res.status(201).json({ class: gymClass });
}

// DELETE /api/classes/:id/book  (Member)
export async function cancelBooking(req, res) {
  const gymClass = await bookingService.cancelBooking(parseId(req.params.id, 'Class'), req.user);
  res.json({ class: gymClass });
}

// GET /api/me/bookings  (Member)
export async function listMyBookings(req, res) {
  const classes = await bookingService.listMyUpcomingBookings(req.user);
  res.json({ classes });
}
