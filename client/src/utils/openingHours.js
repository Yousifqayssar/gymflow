import { OPENING_HOURS } from '../config/gym.js';
import { GYM_TIMEZONE } from './classDisplay.js';

const WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: GYM_TIMEZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// The weekday (1 = Monday) and time "HH:MM" it is now at the gym.
export function gymWeekdayAndTime(now) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(now).map((p) => [p.type, p.value]));
  return { weekday: WEEKDAYS[parts.weekday], time: `${parts.hour}:${parts.minute}` };
}

const hoursFor = (weekday) => OPENING_HOURS.find((row) => row.days.includes(weekday));

// "Open now · until 23:00" or "Closed · opens tomorrow at 06:00". `now` is passed in.
// "HH:MM" strings can be compared as text because they always have two digits.
export function openingStatus(now) {
  const { weekday, time } = gymWeekdayAndTime(now);
  const today = hoursFor(weekday);
  if (today && time >= today.open && time < today.close) {
    return { isOpen: true, text: `Open now · until ${today.close}` };
  }
  if (today && time < today.open) {
    return { isOpen: false, text: `Closed · opens today at ${today.open}` };
  }
  const tomorrow = hoursFor((weekday % 7) + 1);
  return { isOpen: false, text: `Closed · opens tomorrow at ${tomorrow.open}` };
}
