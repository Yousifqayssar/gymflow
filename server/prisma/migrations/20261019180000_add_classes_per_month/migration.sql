-- Membership types: how many group classes a plan includes per membership month (0 = Basic, gym only).
ALTER TABLE "MembershipPlan" ADD COLUMN     "classesPerMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_classesPerMonth_check" CHECK ("classesPerMonth" >= 0 AND "classesPerMonth" <= 60);

-- Each membership keeps the number it was sold with.
ALTER TABLE "Membership" ADD COLUMN     "classesPerMonth" INTEGER NOT NULL DEFAULT 0;

-- Before this change every plan included the group classes: existing plans and memberships
-- become Premium (10 classes a month), so nobody loses access to classes they already paid for.
UPDATE "MembershipPlan" SET "classesPerMonth" = 10;
UPDATE "Membership" SET "classesPerMonth" = 10;
