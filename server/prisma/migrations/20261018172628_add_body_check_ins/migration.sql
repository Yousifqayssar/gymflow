-- CreateEnum
CREATE TYPE "BodyGoal" AS ENUM ('LOSE_WEIGHT', 'BUILD_MUSCLE', 'GET_FIT', 'IMPROVE_ENDURANCE', 'STAY_HEALTHY');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "qrToken" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "BodyCheckIn" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "recordedOn" DATE NOT NULL,
    "heightCm" DECIMAL(4,1) NOT NULL,
    "weightKg" DECIMAL(4,1) NOT NULL,
    "goal" "BodyGoal" NOT NULL,
    "targetWeightKg" DECIMAL(4,1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BodyCheckIn_memberId_recordedOn_key" ON "BodyCheckIn"("memberId", "recordedOn");

-- AddForeignKey
ALTER TABLE "BodyCheckIn" ADD CONSTRAINT "BodyCheckIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
