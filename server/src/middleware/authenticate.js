import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/token.js';
import { toPublicUser } from '../utils/publicUser.js';

// Protects a route: only requests with a valid login token get through.
// The client sends the token in the header:  Authorization: Bearer <token>
// On success, the logged-in user is available as req.user.
export async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    // Signature doesn't match, token was changed, or it has expired.
    throw new AppError(401, 'Invalid or expired token');
  }

  // Load the user fresh from the database, so a deleted account or a changed role
  // takes effect immediately instead of when the old token expires.
  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user) {
    throw new AppError(401, 'Invalid or expired token');
  }

  req.user = toPublicUser(user);
  next();
}
