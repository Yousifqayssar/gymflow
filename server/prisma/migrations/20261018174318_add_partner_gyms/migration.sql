-- AlterTable
ALTER TABLE "User" ALTER COLUMN "qrToken" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "PartnerGym" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "phone" TEXT,
    "latitude" DECIMAL(8,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "hours" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerGym_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerGym_name_key" ON "PartnerGym"("name");
