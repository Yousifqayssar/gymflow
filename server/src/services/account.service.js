import { prisma } from '../lib/prisma.js';
import { toPublicUser } from '../utils/publicUser.js';

// PUT /api/account/avatar – every user may choose their own avatar (or null = initials).
export async function updateAvatar(userId, avatar) {
  const user = await prisma.user.update({ where: { id: userId }, data: { avatar } });
  return toPublicUser(user);
}
