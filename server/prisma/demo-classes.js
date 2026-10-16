// Demo classes: realistic group classes with full information, repeated weekly
// for the next 14 days, and some demo members already booked.
import { env } from '../src/config/env.js';
import { addDays, formatDate } from '../src/utils/dates.js';

const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;

// `days`: weekdays the class takes place. `time`: local gym time.
// `demoBookings`: how many demo members are booked into its first session.
export const DEMO_CLASS_TEMPLATES = [
  {
    title: 'Running Club',
    category: 'RUNNING',
    trainer: 'Mert',
    days: [SAT],
    time: '08:00',
    durationMinutes: 75,
    capacity: 15,
    level: 'INTERMEDIATE',
    intensity: 'HIGH',
    location: 'Bebek Park, main entrance',
    description:
      'A 10 km group run along the Bosphorus from Bebek Park to Ortaköy and back to Bebek by the coastal path. ' +
      'We run at a steady "conversation pace" (about 6 min/km), so nobody is left behind, and finish with ' +
      '10 minutes of stretching by the water. A great way to start the weekend and meet other members.',
    whatToBring: 'Running shoes, comfortable sports clothes, a water bottle. A light jacket if it is windy.',
    healthNotes:
      'You should be able to run 5 km without stopping. Not suitable if you have a knee or ankle injury. ' +
      'Eat something light at least an hour before and tell the trainer about any heart or breathing problems.',
    demoBookings: 7,
  },
  {
    title: 'Morning Yoga',
    category: 'YOGA',
    trainer: 'Gizem',
    days: [MON, WED, FRI],
    time: '07:30',
    durationMinutes: 60,
    capacity: 12,
    level: 'ALL_LEVELS',
    intensity: 'LOW',
    location: 'Studio 1 (2nd floor)',
    description:
      'A calm vinyasa flow to wake up body and mind before work. We combine breathing exercises, gentle sun ' +
      'salutations and balance poses. Every pose has an easier and a harder version, so beginners and ' +
      'experienced yogis practise together.',
    whatToBring: 'Comfortable clothes. Mats and blocks are provided; bring your own mat if you prefer.',
    healthNotes:
      'Suitable for most people. If you are pregnant or have back problems, tell the trainer before the class ' +
      'so she can show you safe alternatives.',
    demoBookings: 5,
  },
  {
    title: 'HIIT Burn',
    category: 'HIIT',
    trainer: 'Mert',
    days: [TUE, THU],
    time: '18:30',
    durationMinutes: 45,
    capacity: 16,
    level: 'ADVANCED',
    intensity: 'HIGH',
    location: 'Studio 2',
    description:
      'High-intensity interval training: 40 seconds of hard work, 20 seconds of rest, for 30 minutes. ' +
      'Burpees, kettlebell swings, jump squats and mountain climbers. Short, intense and very effective ' +
      'for fitness and fat burning.',
    whatToBring: 'Training shoes, a towel and plenty of water.',
    healthNotes:
      'Very demanding for the heart and joints. Not recommended for beginners, during pregnancy, or with ' +
      'high blood pressure or heart conditions. Stop immediately if you feel dizzy.',
    demoBookings: 4,
  },
  {
    title: 'Spinning',
    category: 'CYCLING',
    trainer: 'Mert',
    days: [MON, WED],
    time: '19:00',
    durationMinutes: 50,
    capacity: 20,
    level: 'INTERMEDIATE',
    intensity: 'HIGH',
    location: 'Cycling Room (ground floor)',
    description:
      'An indoor cycling ride to energetic music, with climbs, sprints and recovery phases. You control the ' +
      'resistance of your own bike, so you can ride at your level while staying in the group rhythm.',
    whatToBring: 'Sports shoes with a stiff sole (or cycling shoes with SPD cleats), a towel, water.',
    healthNotes: 'Easy on the joints, but hard on the heart. Arrive 10 minutes early the first time to adjust your bike.',
    demoBookings: 6,
  },
  {
    title: 'Pilates Core',
    category: 'PILATES',
    trainer: 'Gizem',
    days: [TUE, THU],
    time: '10:00',
    durationMinutes: 55,
    capacity: 10,
    level: 'BEGINNER',
    intensity: 'MEDIUM',
    location: 'Studio 1 (2nd floor)',
    description:
      'Mat pilates focusing on a strong core, good posture and a healthy back. Slow, controlled movements ' +
      'with attention to breathing. Ideal if you sit a lot during the day.',
    whatToBring: 'Comfortable, close-fitting clothes and socks with grip. Mats are provided.',
    healthNotes: 'Often recommended for back pain, but ask your doctor first if you have a disc problem.',
    demoBookings: 8,
  },
  {
    title: 'Boxing Basics',
    category: 'BOXING',
    trainer: 'Mert',
    days: [SAT],
    time: '11:00',
    durationMinutes: 60,
    capacity: 12,
    level: 'BEGINNER',
    intensity: 'MEDIUM',
    location: 'Boxing Area',
    description:
      'Learn the basics of boxing: stance, footwork, jab, cross and hook, then practise combinations on pads ' +
      'and bags. No sparring and no contact – just a fun full-body workout and a great way to release stress.',
    whatToBring: 'Training shoes, a towel, water. Hand wraps and gloves can be borrowed at the front desk.',
    healthNotes: 'Not suitable with wrist or shoulder injuries.',
    demoBookings: 3,
  },
  {
    title: 'Strength for Beginners',
    category: 'STRENGTH',
    trainer: 'Mert',
    days: [WED],
    time: '17:00',
    durationMinutes: 60,
    capacity: 8,
    level: 'BEGINNER',
    intensity: 'MEDIUM',
    location: 'Free weights area',
    description:
      'Learn the five basic strength exercises safely: squat, deadlift, bench press, overhead press and row. ' +
      'Small group, so the trainer can correct your technique. After a few sessions you can train on your own with confidence.',
    whatToBring: 'Flat training shoes and a towel.',
    healthNotes: 'Tell the trainer about any back, knee or shoulder problems. We always start with light weights.',
    demoBookings: 8,
  },
  {
    title: 'Stretch & Mobility',
    category: 'MOBILITY',
    trainer: 'Gizem',
    days: [SUN],
    time: '10:00',
    durationMinutes: 45,
    capacity: 15,
    level: 'ALL_LEVELS',
    intensity: 'LOW',
    location: 'Studio 1 (2nd floor)',
    description:
      'A relaxed session to loosen tight hips, shoulders and back after a week of training or sitting. ' +
      'Foam rolling, dynamic stretches and mobility drills. Perfect for recovery.',
    whatToBring: 'Comfortable clothes. Foam rollers and mats are provided.',
    healthNotes: 'Suitable for everyone. Stretch only until you feel a gentle pull, never pain.',
    demoBookings: 2,
  },
];

// The gym's UTC offset on a given day, e.g. "+03:00" for Istanbul.
function gymUtcOffset(date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: env.GYM_TIMEZONE, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName').value; // "GMT+03:00" (or "GMT" for UTC)
  return name === 'GMT' ? 'Z' : name.slice(3);
}

// A calendar day (midnight UTC, as used by the date helpers) + "08:00" gym time → the exact moment.
function atGymTime(day, time) {
  return new Date(`${formatDate(day)}T${time}:00${gymUtcOffset(day)}`);
}

const validOn = (member, day) => member.memberships.some((m) => m.startDate <= day && day <= m.endDate);

// Creates the demo class sessions for the next 14 days and books some demo members.
// `trainers`: { Mert: id, Gizem: id }. `members`: demo members with their memberships.
export async function seedDemoClasses(prisma, { today, now, trainers, members }) {
  let classCount = 0;

  for (const [templateIndex, template] of DEMO_CLASS_TEMPLATES.entries()) {
    const { trainer, days, time, demoBookings, ...fields } = template;
    let occurrence = 0;

    for (let offset = 0; offset < 14; offset++) {
      const day = addDays(today, offset);
      if (!days.includes(day.getUTCDay())) continue;

      const startsAt = atGymTime(day, time);
      if (startsAt <= now) continue; // only future sessions

      const gymClass = await prisma.gymClass.create({
        data: { ...fields, startsAt, trainerId: trainers[trainer] },
      });
      classCount++;

      // Book members whose membership is valid that day (the same rule the app enforces).
      // Later sessions get fewer bookings; members are rotated so not always the same people come.
      const eligible = members.filter((member) => validOn(member, day));
      const rotated = [...eligible.slice(templateIndex % (eligible.length || 1)), ...eligible.slice(0, templateIndex % (eligible.length || 1))];
      const count = Math.max(0, Math.min(demoBookings - occurrence * 3, fields.capacity, rotated.length));
      for (const member of rotated.slice(0, count)) {
        await prisma.booking.create({ data: { classId: gymClass.id, memberId: member.id } });
      }
      occurrence++;
    }
  }

  return classCount;
}
