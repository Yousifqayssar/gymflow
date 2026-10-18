-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "qrToken" SET DEFAULT gen_random_uuid()::text;
