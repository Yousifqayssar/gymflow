-- How a member was marked present at a class.
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'TRAINER');

-- When (and how) a member attended a booked class. Empty after the class = no-show.
ALTER TABLE "Booking" ADD COLUMN     "attendanceMethod" "AttendanceMethod",
ADD COLUMN     "attendedAt" TIMESTAMPTZ(3);

-- When the trainer first opened the attendance QR (no-shows only count for these classes).
ALTER TABLE "GymClass" ADD COLUMN     "attendanceOpenedAt" TIMESTAMPTZ(3);
