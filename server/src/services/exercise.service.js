import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

function toPublicExercise(exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    description: exercise.description,
    isActive: exercise.isActive,
  };
}

function rethrowDuplicateName(error) {
  if (error.code === 'P2002') {
    throw new AppError(409, 'An exercise with this name already exists');
  }
  throw error;
}

// GET /api/exercises – the library, sorted by muscle group and name.
// Inactive exercises are only included for staff who ask for them (to manage the library).
export async function listExercises({ muscleGroup, search, includeInactive }, user) {
  const showInactive = includeInactive === 'true' && user.role !== 'MEMBER';
  const exercises = await prisma.exercise.findMany({
    where: {
      ...(muscleGroup && { muscleGroup }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(!showInactive && { isActive: true }),
    },
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  });
  return exercises.map(toPublicExercise);
}

// POST /api/exercises (Admin, Trainer)
export async function createExercise(input) {
  try {
    return toPublicExercise(await prisma.exercise.create({ data: input }));
  } catch (error) {
    rethrowDuplicateName(error);
  }
}

// PUT /api/exercises/:id (Admin, Trainer) – also used to deactivate (isActive: false).
export async function updateExercise(id, input) {
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Exercise not found');
  try {
    return toPublicExercise(await prisma.exercise.update({ where: { id }, data: input }));
  } catch (error) {
    rethrowDuplicateName(error);
  }
}
