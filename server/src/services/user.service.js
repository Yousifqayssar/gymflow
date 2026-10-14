import { prisma } from '../lib/prisma.js';
import { toPublicUser } from '../utils/publicUser.js';

// Returns all users, newest first, without password hashes.
export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return users.map(toPublicUser);
}
