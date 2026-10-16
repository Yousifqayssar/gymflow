import { env } from '../config/env.js';

// Calendar dates (without time) are represented as JavaScript Dates at 00:00 UTC.
// This matches how Prisma returns PostgreSQL DATE columns, and because we only ever
// work in UTC, adding days or months is never shifted by daylight saving time.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// "2026-10-15" → Date at 2026-10-15T00:00:00Z
export function parseDate(text) {
  const [year, month, day] = text.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// Date → "2026-10-15"
export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// The calendar date it currently is in the given time zone.
// Example: 2026-10-15 at 22:30 UTC is already 16 October in Istanbul (UTC+3).
export function todayInTimeZone(timeZone, now = new Date()) {
  // The "en-CA" locale formats dates as YYYY-MM-DD.
  const text = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parseDate(text);
}

// Today in the gym's time zone (from GYM_TIMEZONE in .env).
export function todayInGym(now = new Date()) {
  return todayInTimeZone(env.GYM_TIMEZONE, now);
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

// Number of days from `from` to `to` (negative if `to` is earlier).
export function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function daysInMonth(year, monthIndex) {
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

// Last valid day of a membership of `months` months that starts on `startDate`.
// Rule: it ends the day before the same day-of-month `months` months later.
// If that day doesn't exist (e.g. 31 February), it ends on the last day of that month.
//   1 Oct 2026 + 1 month  → 31 Oct 2026
//  31 Jan 2027 + 1 month  → 28 Feb 2027 (29 Feb in a leap year)
export function calculateEndDate(startDate, months) {
  const startDay = startDate.getUTCDate();
  // Date.UTC handles month overflow, e.g. month 13 becomes January of the next year.
  const target = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + months, 1));
  const lastDayOfTargetMonth = daysInMonth(target.getUTCFullYear(), target.getUTCMonth());

  if (startDay > lastDayOfTargetMonth) {
    return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), lastDayOfTargetMonth));
  }

  const sameDayInTargetMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), startDay));
  return addDays(sameDayInTargetMonth, -1);
}
