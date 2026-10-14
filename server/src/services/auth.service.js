import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/token.js';
import { toPublicUser } from '../utils/publicUser.js';

// Same message for "unknown email" and "wrong password",
// so attackers can't find out which emails are registered.
const INVALID_CREDENTIALS = 'Invalid email or password';

// A real bcrypt hash of a random value. Used when the email doesn't exist,
// so a failed login always takes the same time (see login() below).
const DUMMY_HASH = await hashPassword('dummy-password-for-timing');

// Creates a new MEMBER account and logs the user in.
export async function register({ email, password, firstName, lastName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email is already registered');
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      role: 'MEMBER', // always MEMBER: admins and trainers are never created via public sign-up
    },
  });

  return { user: toPublicUser(user), token: signToken(user) };
}

// Checks email + password and returns the user with a new token.
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt, even if the user doesn't exist. Otherwise "unknown email"
  // would answer faster than "wrong password", and the timing would reveal which emails exist.
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw new AppError(401, INVALID_CREDENTIALS);
  }

  return { user: toPublicUser(user), token: signToken(user) };
}
