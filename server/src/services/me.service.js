import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { pointsSummary } from './points.js';
import { QR_PREFIX } from './checkIn.service.js';

const RECENT_VISITS = 10;

// GET /api/me/qr – what the member's QR code contains.
export async function getMyQrCode(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { qrToken: true } });
  return { qrContent: `${QR_PREFIX}${user.qrToken}` };
}

// POST /api/me/qr/reset – a new random token; the old QR code stops working immediately
// (e.g. if someone took a photo of it).
export async function resetMyQrCode(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { qrToken: randomUUID() },
    select: { qrToken: true },
  });
  return { qrContent: `${QR_PREFIX}${user.qrToken}` };
}

// GET /api/me/visits – points, level and the most recent visits.
export async function getMyVisits(userId) {
  const [visits, recent] = await Promise.all([
    prisma.checkIn.count({ where: { memberId: userId } }),
    prisma.checkIn.findMany({
      where: { memberId: userId },
      orderBy: { checkedInAt: 'desc' },
      take: RECENT_VISITS,
      select: { id: true, checkedInAt: true, method: true },
    }),
  ]);
  return { ...pointsSummary(visits), recentVisits: recent };
}
