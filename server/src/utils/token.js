import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Creates a signed login token (JWT) for a user.
// The token contains the user's id ("sub" = subject) and role, so the server
// can recognise the user on later requests without asking the database for the password again.
export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Checks the signature and expiry of a token and returns its content.
// Throws an error if the token was changed, signed with another secret, or has expired.
export function verifyToken(token) {
  // Only accept the algorithm we sign with, so an attacker can't choose a weaker one.
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}
