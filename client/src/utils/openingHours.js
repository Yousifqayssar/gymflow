import { OPENING_HOURS } from '../config/gym.js';
import { GYM_TIMEZONE } from './classDisplay.js';

const WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
export const WEEKDAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

// Our own gym's hours (config/gym.js) in the same form as a partner gym's hours from the API:
// [{ day: 1, open: "06:00", close: "23:00" }, ...] – a missing day means closed.
export const MAIN_GYM_HOURS = OPENING_HOURS.flatMap((row) => row.days.map((day) => ({ day, open: row.open, close: row.close })));

// "Open now · until 23:00", "Closed · opens today at 08:00", "Closed · opens Monday at 06:00".
// `now` is passed in (components must not read the clock while rendering).
// "HH:MM" strings can be compared as text because they always have two digits.
export function openingStatus(now, hours = MAIN_GYM_HOURS) {
  const { weekday, time } = gymWeekdayAndTime(now);
  const hoursOn = (day) => hours.find((row) => row.day === day);
  const today = hoursOn(weekday);

  if (today && time >= today.open && time < today.close) {
    return { isOpen: true, text: `Open now · until ${today.close}` };
  }
  if (today && time < today.open) {
    return { isOpen: false, text: `Closed · opens today at ${today.open}` };
  }
  // Look for the next day it opens (tomorrow, or later if it is closed on some days).
  for (let ahead = 1; ahead <= 7; ahead++) {
    const day = ((weekday + ahead - 1) % 7) + 1;
    const next = hoursOn(day);
    if (next) {
      const when = ahead === 1 ? 'tomorrow' : WEEKDAY_NAMES[day];
      return { isOpen: false, text: `Closed · opens ${when} at ${next.open}` };
    }
  }
  return { isOpen: false, text: 'Closed' };
}

// Today's hours as text, e.g. "06:00 – 23:00" or "Closed today".
export function hoursToday(now, hours) {
  const { weekday } = gymWeekdayAndTime(now);
  const today = hours.find((row) => row.day === weekday);
  return today ? `${today.open} – ${today.close}` : 'Closed today';
}
