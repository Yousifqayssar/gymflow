import { prisma } from '../../src/lib/prisma.js';
import { hashPassword } from '../../src/utils/password.js';
import { signToken } from '../../src/utils/token.js';

export const TEST_PASSWORD = 'secret123';

// Creates a user directly in the test database and returns it with a valid token.
// Example: const { user, token } = await createUser({ role: 'ADMIN' });
export async function createUser({ role = 'MEMBER', email } = {}) {
  const user = await prisma.user.create({
    data: {
      email: email ?? `${role.toLowerCase()}-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: await hashPassword(TEST_PASSWORD),
      firstName: 'Test',
      lastName: role,
      role,
    },
  });

  return { user, token: signToken(user) };
}

// Builds the Authorization header value for a token.
export const bearer = (token) => `Bearer ${token}`;
