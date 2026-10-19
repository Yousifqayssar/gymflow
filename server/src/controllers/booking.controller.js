import * as bookingService from '../services/booking.service.js';
import * as classBalanceService from '../services/classBalance.service.js';
import { parseId } from '../utils/params.js';

// POST /api/classes/:id/book  (Member)
export async function bookClass(req, res) {
  const gymClass = await bookingService.bookClass(parseId(req.params.id, 'Class'), req.user);
  res.status(201).json({ class: gymClass });
}

// DELETE /api/classes/:id/book  (Member) – { class, refunded } (refunded: amount of a paid class, or null)
export async function cancelBooking(req, res) {
  res.json(await bookingService.cancelBooking(parseId(req.params.id, 'Class'), req.user));
}

// GET /api/classes/:id/booking-quote  (Member) – free with the membership, or the price to pay
export async function getBookingQuote(req, res) {
  res.json(await bookingService.getBookingQuote(parseId(req.params.id, 'Class'), req.user));
}

// POST /api/classes/:id/book-and-pay  { checkoutId, card }  (Member) – pay by card and book in one step
export async function bookAndPay(req, res) {
  res.status(201).json(await bookingService.bookAndPay(parseId(req.params.id, 'Class'), req.user, req.body));
}

// GET /api/me/class-balance  (Member) – classes left this membership month
export async function getMyClassBalance(req, res) {
  res.json(await classBalanceService.getMyClassBalance(req.user.id));
}

// GET /api/me/bookings  (Member)
export async function listMyBookings(req, res) {
  const classes = await bookingService.listMyUpcomingBookings(req.user);
  res.json({ classes });
}
