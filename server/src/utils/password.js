import bcrypt from 'bcryptjs';

// How much work bcrypt does per hash (2^10 rounds). Higher = slower = harder to crack.
// 10 is the common default: about 50–100 ms per hash.
const SALT_ROUNDS = 10;

// Turns a plain password into a hash that is safe to store in the database.
// bcrypt adds a random "salt", so the same password gives a different hash each time.
export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Checks a login attempt against the stored hash. Returns true or false.
export function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}
