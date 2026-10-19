-- Paying per class: Basic members pay each class's price; Premium members with no classes left pay it with a discount.

-- What a payment bought, and a new status for paid class bookings cancelled before the class.
CREATE TYPE "PaymentKind" AS ENUM ('MEMBERSHIP', 'CLASS');
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- Every class has a price (existing classes: 200).
ALTER TABLE "GymClass" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 200;
ALTER TABLE "GymClass" ADD CONSTRAINT "GymClass_price_check" CHECK ("price" > 0);

-- A payment is for a membership (planId) or for one class (classId).
ALTER TABLE "Payment" ADD COLUMN     "classId" INTEGER,
ADD COLUMN     "kind" "PaymentKind" NOT NULL DEFAULT 'MEMBERSHIP',
ADD COLUMN     "refundedAt" TIMESTAMPTZ(3),
ALTER COLUMN "planId" DROP NOT NULL;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_membership_has_plan_check" CHECK ("kind" <> 'MEMBERSHIP' OR "planId" IS NOT NULL);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "GymClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The booking a class payment paid for. Paid bookings do not use the monthly included classes.
ALTER TABLE "Booking" ADD COLUMN     "paymentId" INTEGER;
CREATE UNIQUE INDEX "Booking_paymentId_key" ON "Booking"("paymentId");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
