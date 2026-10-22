import * as checkInService from '../services/checkIn.service.js';

// POST /api/check-ins  (Admin, Trainer)
// 201 for a new visit, 200 if the member was already checked in today.
export async function checkIn(req, res) {
  const result = await checkInService.checkIn(req.body.code, req.user, req.body.partnerGymId ?? null);
  res.status(result.alreadyCheckedIn ? 200 : 201).json(result);
}

// GET /api/check-ins/today  (Admin, Trainer)
export async function listToday(req, res) {
  const checkIns = await checkInService.listTodaysCheckIns();
  res.json({ checkIns, count: checkIns.length });
}
