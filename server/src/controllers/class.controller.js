import * as classService from '../services/class.service.js';
import { parseQuery } from '../middleware/validate.js';
import { listClassesQuerySchema } from '../validation/class.schemas.js';
import { parseId } from '../utils/params.js';

// GET /api/classes?category=YOGA&from=...&to=...
export async function listClasses(req, res) {
  const filters = parseQuery(listClassesQuerySchema, req.query);
  const classes = await classService.listClasses(filters, req.user);
  res.json({ classes });
}

// GET /api/classes/:id
export async function getClass(req, res) {
  const gymClass = await classService.getClass(parseId(req.params.id, 'Class'), req.user);
  res.json({ class: gymClass });
}

// POST /api/classes  (Admin, Trainer)
export async function createClass(req, res) {
  const gymClass = await classService.createClass(req.body, req.user);
  res.status(201).json({ class: gymClass });
}

// PATCH /api/classes/:id  (Admin, or the class's own trainer)
export async function updateClass(req, res) {
  const gymClass = await classService.updateClass(parseId(req.params.id, 'Class'), req.body, req.user);
  res.json({ class: gymClass });
}

// POST /api/classes/:id/cancel  (Admin, or the class's own trainer)
export async function cancelClass(req, res) {
  const gymClass = await classService.cancelClass(parseId(req.params.id, 'Class'), req.user);
  res.json({ class: gymClass });
}
