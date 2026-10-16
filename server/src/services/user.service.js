import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { toPublicUser } from '../utils/publicUser.js';

// Creates a user account. Shared by public sign-up (always MEMBER)
// and by admins creating Member/Trainer accounts. Returns the database row.
export async function createUserAccount({ email, password, firstName, lastName, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email is already registered');
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      role,
    },
  });
}

// Lists users, newest first, without password hashes.
// Optional filters: role ('MEMBER' | 'TRAINER' | 'ADMIN') and a search text
// that matches first name, last name or email (ignoring letter case).
export async function listUsers({ role, search } = {}) {
  const where = {};
  if (role) {
    where.role = role;
  }
  if (search) {
    const contains = { contains: search, mode: 'insensitive' };
    where.OR = [{ firstName: contains }, { lastName: contains }, { email: contains }];
  }

  const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  return users.map(toPublicUser);
}
