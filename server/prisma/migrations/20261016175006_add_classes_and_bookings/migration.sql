-- CreateEnum
CREATE TYPE "ClassCategory" AS ENUM ('RUNNING', 'YOGA', 'HIIT', 'CYCLING', 'PILATES', 'BOXING', 'STRENGTH', 'MOBILITY');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

-- CreateEnum
CREATE TYPE "ClassIntensity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "GymClass" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ClassCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "level" "ClassLevel" NOT NULL,
    "intensity" "ClassIntensity" NOT NULL,
    "whatToBring" TEXT NOT NULL DEFAULT '',
    "healthNotes" TEXT NOT NULL DEFAULT '',
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "trainerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymClass_startsAt_idx" ON "GymClass"("startsAt");

-- CreateIndex
CREATE INDEX "GymClass_trainerId_idx" ON "GymClass"("trainerId");

-- CreateIndex
CREATE INDEX "Booking_memberId_idx" ON "Booking"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_classId_memberId_key" ON "Booking"("classId", "memberId");

-- AddForeignKey
ALTER TABLE "GymClass" ADD CONSTRAINT "GymClass_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "GymClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business rules enforced by the database itself (added by hand: Prisma cannot express CHECK constraints).
-- "Capacities must be positive" (project requirement) and a sensible class length.
ALTER TABLE "GymClass" ADD CONSTRAINT "GymClass_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "GymClass" ADD CONSTRAINT "GymClass_durationMinutes_range" CHECK ("durationMinutes" BETWEEN 15 AND 300);