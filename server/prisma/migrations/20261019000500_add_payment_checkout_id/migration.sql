-- A random id per online checkout. Unique, so the same checkout can never be charged twice.
ALTER TABLE "Payment" ADD COLUMN "checkoutId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutId_key" ON "Payment"("checkoutId");
