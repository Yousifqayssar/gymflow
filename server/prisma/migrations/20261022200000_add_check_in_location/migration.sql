-- Where a visit happened: empty = our own gym, otherwise the partner gym (Premium members only).
-- If a partnership ends and the partner gym is deleted, its visits stay in the history (SET NULL).
ALTER TABLE "CheckIn" ADD COLUMN     "partnerGymId" INTEGER;
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_partnerGymId_fkey" FOREIGN KEY ("partnerGymId") REFERENCES "PartnerGym"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "CheckIn_partnerGymId_idx" ON "CheckIn"("partnerGymId");
