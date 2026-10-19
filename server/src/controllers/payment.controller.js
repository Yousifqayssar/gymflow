import * as paymentService from '../services/payment.service.js';
import { parseQuery } from '../middleware/validate.js';
import { listPaymentsQuerySchema, memberPreviewQuerySchema } from '../validation/payment.schemas.js';

// GET /api/me/membership/preview?planId=3  (Member)
export async function previewMyMembership(req, res) {
  const input = parseQuery(memberPreviewQuerySchema, req.query);
  res.json({ preview: await paymentService.previewMyMembership(req.user.id, input) });
}

// POST /api/me/checkout  (Member) – pay by card, get the membership
export async function checkout(req, res) {
  res.status(201).json(await paymentService.checkout(req.user.id, req.body));
}

// GET /api/me/payments  (Member)
export async function listMyPayments(req, res) {
  res.json(await paymentService.listMyPayments(req.user.id));
}

// GET /api/payments?status=PAID&userId=4  (Admin)
export async function listPayments(req, res) {
  const filters = parseQuery(listPaymentsQuerySchema, req.query);
  res.json(await paymentService.listPayments(filters));
}
