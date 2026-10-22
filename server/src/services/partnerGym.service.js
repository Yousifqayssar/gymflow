import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { addDays, todayInGym } from '../utils/dates.js';
import { getMembershipStatus, MembershipStatus, pickCurrentMembership } from './membershipStatus.js';

function toPublicPartnerGym(gym) {
  return {
    id: gym.id,
    name: gym.name,
    address: gym.address,
    district: gym.district,
    phone: gym.phone,
    latitude: Number(gym.latitude),
    longitude: Number(gym.longitude),
    // Always sorted Monday → Sunday.
    hours: [...gym.hours].sort((a, b) => a.day - b.day),
  };
}

// Prisma error P2002 = a unique column (here: the name) already has this value.
function rethrowDuplicateName(error) {
  if (error.code === 'P2002') {
    throw new AppError(409, 'A partner gym with this name already exists');
  }
  throw error;
}

// Which gyms a member may train at today: PREMIUM = our gym + all partner gyms,
// BASIC = our own gym only, NONE = no valid membership today.
async function memberAccess(memberId, today) {
  const memberships = await prisma.membership.findMany({ where: { userId: memberId } });
  const current = pickCurrentMembership(memberships, today);
  const status = getMembershipStatus(current, today);
  if (status !== MembershipStatus.ACTIVE && status !== MembershipStatus.EXPIRING_SOON) return 'NONE';
  return current.classesPerMonth > 0 ? 'PREMIUM' : 'BASIC';
}

// GET /api/partner-gyms – every logged-in user (home page map).
//   members also get: access (PREMIUM | BASIC | NONE), and per gym canTrainHere + myVisits;
//   staff also get: visitsThisMonth per gym (and for our own gym: homeGym.visitsThisMonth).
export async function listPartnerGyms(viewer) {
  const gyms = (await prisma.partnerGym.findMany({ orderBy: { name: 'asc' } })).map(toPublicPartnerGym);
  const today = todayInGym();

  if (viewer.role === 'MEMBER') {
    const access = await memberAccess(viewer.id, today);
    const visits = await prisma.checkIn.groupBy({ by: ['partnerGymId'], where: { memberId: viewer.id }, _count: true });
    const visitsAt = (gymId) => visits.find((v) => v.partnerGymId === gymId)?._count ?? 0;
    return {
      access,
      homeGym: { canTrainHere: access !== 'NONE', myVisits: visitsAt(null) },
      gyms: gyms.map((gym) => ({ ...gym, canTrainHere: access === 'PREMIUM', myVisits: visitsAt(gym.id) })),
    };
  }

  // Visits since the 1st of this month (gym time zone).
  const monthStart = addDays(today, 1 - today.getUTCDate());
  const visits = await prisma.checkIn.groupBy({ by: ['partnerGymId'], where: { gymDay: { gte: monthStart } }, _count: true });
  const visitsAt = (gymId) => visits.find((v) => v.partnerGymId === gymId)?._count ?? 0;
  return {
    access: null,
    homeGym: { visitsThisMonth: visitsAt(null) },
    gyms: gyms.map((gym) => ({ ...gym, visitsThisMonth: visitsAt(gym.id) })),
  };
}

// POST /api/partner-gyms (Admin)
export async function createPartnerGym(input) {
  try {
    return toPublicPartnerGym(await prisma.partnerGym.create({ data: input }));
  } catch (error) {
    rethrowDuplicateName(error);
  }
}

async function findOrThrow(id) {
  const gym = await prisma.partnerGym.findUnique({ where: { id } });
  if (!gym) throw new AppError(404, 'Partner gym not found');
  return gym;
}

// PUT /api/partner-gyms/:id (Admin)
export async function updatePartnerGym(id, input) {
  await findOrThrow(id);
  try {
    return toPublicPartnerGym(await prisma.partnerGym.update({ where: { id }, data: input }));
  } catch (error) {
    rethrowDuplicateName(error);
  }
}

// DELETE /api/partner-gyms/:id (Admin) – the partnership ended.
export async function deletePartnerGym(id) {
  await findOrThrow(id);
  await prisma.partnerGym.delete({ where: { id } });
}
