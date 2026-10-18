-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ALTER COLUMN "qrToken" SET DEFAULT gen_random_uuid()::text;
