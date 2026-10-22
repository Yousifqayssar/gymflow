// Demo check-ins: a visit history for the last 45 days, so points, levels and
// "today's check-ins" have realistic content. Members only visit on days when their
// membership was valid – the same rule the check-in desk enforces. Premium members sometimes train
// at a partner gym (about every 4th visit); Basic members only at our own gym, like at the desk.
import { addDays } from '../src/utils/dates.js';
import { atGymTime } from './demo-classes.js';

const HISTORY_DAYS = 45;

// How often each demo member comes: every N-th day (1 = almost every day → Gold level).
const VISIT_EVERY = {
  Mehmet: 1,
  Elif: 2,
  Can: 2,
  Merve: 2,
  Ayse: 3,
  Zeynep: 3,
  Ahmet: 3,
  Burak: 2,
  Deniz: 4,
  Emre: 3,
};

// Members already checked in this morning (gym time), shown in "today's check-ins".
const TODAY = [
  ['Mehmet', '07:05'],
  ['Elif', '07:40'],
  ['Zeynep', '08:15'],
  ['Merve', '09:30'],
];

const validOn = (member, day) => member.memberships.some((m) => m.startDate <= day && day <= m.endDate);
const premiumOn = (member, day) => member.memberships.some((m) => m.startDate <= day && day <= m.endDate && m.classesPerMonth > 0);

//   partnerGymIds: ids of the partner gyms (visits there are spread over them)
export async function seedDemoCheckIns(prisma, { today, now, members, staffId, partnerGymIds = [] }) {
  const data = [];
  let visitNumber = 0;
  // Every 4th visit of a Premium member is at a partner gym, taking turns between the gyms.
  const locationFor = (member, day) => {
    visitNumber++;
    if (!partnerGymIds.length || !premiumOn(member, day) || visitNumber % 4 !== 0) return null;
    return partnerGymIds[(visitNumber / 4) % partnerGymIds.length];
  };

  for (const member of members) {
    const every = VISIT_EVERY[member.firstName];
    if (!every) continue;

    for (let offset = HISTORY_DAYS; offset >= 1; offset--) {
      const day = addDays(today, -offset);
      const isSunday = day.getUTCDay() === 0;
      if (offset % every !== 0 || (every === 1 && isSunday) || !validOn(member, day)) continue;

      // A different, realistic time of day for each member.
      const hour = String(6 + ((member.id + offset) % 13)).padStart(2, '0');
      data.push({ memberId: member.id, gymDay: day, checkedInAt: atGymTime(day, `${hour}:15`), method: 'QR', checkedInById: staffId, partnerGymId: locationFor(member, day) });
    }
  }

  for (const [firstName, time] of TODAY) {
    const member = members.find((m) => m.firstName === firstName);
    const moment = atGymTime(today, time);
    if (member && moment <= now && validOn(member, today)) {
      data.push({ memberId: member.id, gymDay: today, checkedInAt: moment, method: 'QR', checkedInById: staffId });
    }
  }

  await prisma.checkIn.createMany({ data });
  return data.length;
}
