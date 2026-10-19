import * as attendanceService from '../services/attendance.service.js';
import { parseId } from '../utils/params.js';

// GET /api/classes/:id/attendance  (Admin, the class's trainer) – QR code + who is present
export async function getAttendance(req, res) {
  res.json(await attendanceService.getAttendance(parseId(req.params.id, 'Class'), req.user));
}

// PUT /api/classes/:id/attendance/:memberId  { present }  (Admin, the class's trainer)
export async function markAttendance(req, res) {
  const result = await attendanceService.markAttendance(parseId(req.params.id, 'Class'), parseId(req.params.memberId, 'Member'), req.body.present, req.user);
  res.json(result);
}

// POST /api/classes/:id/attend  { code }  (Member) – scanned the trainer's QR
export async function attendClass(req, res) {
  res.json(await attendanceService.attendClass(parseId(req.params.id, 'Class'), req.body.code, req.user));
}
