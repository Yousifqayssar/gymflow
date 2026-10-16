import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser } from './helpers/users.js';
import { createClass } from './helpers/classes.js';

// The database itself enforces the class rules ("last line of defence"),
// even when data is written without going through the API.

let trainer;
let member;

beforeEach(async () => {
  await resetDatabase();
  trainer = (await createUser({ role: 'TRAINER' })).user;
  member = (await createUser({ role: 'MEMBER' })).user;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('class and booking database rules', () => {
  it('stores a class with all its information', async () => {
    const gymClass = await createClass({
      trainerId: trainer.id,
      whatToBring: 'Yoga mat, water',
      healthNotes: 'Tell the trainer about any injuries.',
    });

    expect(gymClass).toMatchObject({ whatToBring: 'Yoga mat, water', isCancelled: false });
  });

  it('rejects a capacity of 0', async () => {
    await expect(createClass({ trainerId: trainer.id, capacity: 0 })).rejects.toThrow(/GymClass_capacity_positive/);
  });

  it.each([10, 301])('rejects a duration of %i minutes', async (durationMinutes) => {
    await expect(createClass({ trainerId: trainer.id, durationMinutes })).rejects.toThrow(/GymClass_durationMinutes_range/);
  });

  it('rejects an unknown category', async () => {
    await expect(createClass({ trainerId: trainer.id, category: 'SWIMMING' })).rejects.toThrow();
  });

  it('makes it impossible to book the same class twice', async () => {
    const gymClass = await createClass({ trainerId: trainer.id });
    await prisma.booking.create({ data: { classId: gymClass.id, memberId: member.id } });

    await expect(prisma.booking.create({ data: { classId: gymClass.id, memberId: member.id } })).rejects.toThrow(
      /Unique constraint/,
    );
  });

  it('does not allow deleting a trainer who still has classes', async () => {
    await createClass({ trainerId: trainer.id });

    await expect(prisma.user.delete({ where: { id: trainer.id } })).rejects.toThrow();
  });

  it('removes a member’s bookings when the member is deleted', async () => {
    const gymClass = await createClass({ trainerId: trainer.id });
    await prisma.booking.create({ data: { classId: gymClass.id, memberId: member.id } });

    await prisma.user.delete({ where: { id: member.id } });

    expect(await prisma.booking.count()).toBe(0);
  });
});
