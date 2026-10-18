import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

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

// GET /api/partner-gyms – every logged-in user (home page map).
export async function listPartnerGyms() {
  const gyms = await prisma.partnerGym.findMany({ orderBy: { name: 'asc' } });
  return gyms.map(toPublicPartnerGym);
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
