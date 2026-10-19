// Demo class history: a few classes from the last two weeks where the trainer took attendance.
// Most booked members scanned the QR; Elif and Ayse each missed one class (−10 points),
// so the Rewards page and the class pages show what a no-show looks like.
import { addDays } from '../src/utils/dates.js';
import { atGymTime, DEMO_CLASS_PRICES, DEMO_CLASS_TEMPLATES } from './demo-classes.js';

const MS_PER_MINUTE = 60 * 1000;
const BOOKED_PER_CLASS = 5;

// [days ago, class title, who did not come]
const PAST_SESSIONS = [
  [2, 'Morning Yoga', 'Ayse'],
  [6, 'Morning Yoga', 'Elif'],
  [9, 'Running Club', null],
];


export async function seedDemoPastClasses(prisma, { today, trainers, members, allowance }) {
  let noShows = 0;

  for (const [daysAgo, title, missedBy] of PAST_SESSIONS) {
    const { trainer, days, time, demoBookings, ...fields } = DEMO_CLASS_TEMPLATES.find((t) => t.title === title);
    const day = addDays(today, -daysAgo);
    const startsAt = atGymTime(day, time);
    const gymClass = await prisma.gymClass.create({
      data: { ...fields, startsAt, trainerId: trainers[trainer], price: DEMO_CLASS_PRICES[fields.category], attendanceOpenedAt: new Date(startsAt.getTime() - 10 * MS_PER_MINUTE) },
    });

    // The member who misses the class is always booked; the others fill the remaining spots.
    const eligible = members.filter((member) => allowance.canBook(member, day));
    const absent = eligible.find((member) => member.firstName === missedBy);
    const booked = [...(absent ? [absent] : []), ...eligible.filter((m) => m !== absent)].slice(0, BOOKED_PER_CLASS);

    for (const member of booked) allowance.use(member, day);
    await prisma.booking.createMany({
      data: booked.map((member, index) => {
        if (member === absent) return { classId: gymClass.id, memberId: member.id, createdAt: addDays(startsAt, -2) };
        return {
          classId: gymClass.id,
          memberId: member.id,
          createdAt: addDays(startsAt, -2),
          // Arrived a few minutes before the start; one was marked by the trainer (phone battery dead).
          attendedAt: new Date(startsAt.getTime() - (index + 1) * MS_PER_MINUTE),
          attendanceMethod: index === booked.length - 1 ? 'TRAINER' : 'QR',
        };
      }),
    });
    if (absent) noShows++;
  }

  return { pastClasses: PAST_SESSIONS.length, noShows };
}
