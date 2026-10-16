import { prisma } from '../../src/lib/prisma.js';

// Creates a class directly in the test database. Only the trainer is required;
// everything else has sensible defaults that tests can override.
export function createClass({ trainerId, ...overrides }) {
  return prisma.gymClass.create({
    data: {
      title: 'Morning Yoga',
      category: 'YOGA',
      description: 'A calm yoga flow to start the day with more energy and less stress.',
      location: 'Studio 1',
      startsAt: new Date('2026-10-20T07:00:00Z'),
      durationMinutes: 60,
      capacity: 10,
      level: 'ALL_LEVELS',
      intensity: 'LOW',
      trainerId,
      ...overrides,
    },
  });
}
