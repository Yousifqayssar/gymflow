import { Bike, Dumbbell, Flower2, Footprints, HandFist, PersonStanding, StretchHorizontal, Zap } from 'lucide-react';
// Photos from Unsplash (free to use under the Unsplash License), stored in the project.
// Vite bundles them and gives each a unique file name, so browsers can cache them safely.
import runningPhoto from '../assets/classes/running.jpg';
import yogaPhoto from '../assets/classes/yoga.jpg';
import hiitPhoto from '../assets/classes/hiit.jpg';
import cyclingPhoto from '../assets/classes/cycling.jpg';
import pilatesPhoto from '../assets/classes/pilates.jpg';
import boxingPhoto from '../assets/classes/boxing.jpg';
import strengthPhoto from '../assets/classes/strength.jpg';
import mobilityPhoto from '../assets/classes/mobility.jpg';

// How each class category looks: label, icon, photo and colours (one place for the whole app).
// `gradient` tints the photo in the category's colours; `soft` is for small icon boxes.
// (Tailwind needs complete class names written out like this.)
export const CATEGORY_DISPLAY = {
  RUNNING: {
    label: 'Running',
    icon: Footprints,
    photo: runningPhoto,
    gradient: 'from-orange-400 via-orange-500 to-rose-500',
    soft: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300',
  },
  YOGA: {
    label: 'Yoga',
    icon: Flower2,
    photo: yogaPhoto,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    soft: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  HIIT: {
    label: 'HIIT',
    icon: Zap,
    photo: hiitPhoto,
    gradient: 'from-rose-500 via-red-500 to-orange-500',
    soft: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300',
  },
  CYCLING: {
    label: 'Cycling',
    icon: Bike,
    photo: cyclingPhoto,
    gradient: 'from-sky-400 via-sky-500 to-blue-600',
    soft: 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  PILATES: {
    label: 'Pilates',
    icon: PersonStanding,
    photo: pilatesPhoto,
    gradient: 'from-pink-400 via-pink-500 to-rose-400',
    soft: 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300',
  },
  BOXING: {
    label: 'Boxing',
    icon: HandFist,
    photo: boxingPhoto,
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    soft: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
  },
  STRENGTH: {
    label: 'Strength',
    icon: Dumbbell,
    photo: strengthPhoto,
    gradient: 'from-indigo-500 via-indigo-600 to-slate-800',
    soft: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  },
  MOBILITY: {
    label: 'Mobility',
    icon: StretchHorizontal,
    photo: mobilityPhoto,
    gradient: 'from-teal-400 via-emerald-500 to-green-600',
    soft: 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300',
  },
};

export const LEVEL_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All levels',
};

// Intensity as text plus 1–3 filled dots.
export const INTENSITY_DISPLAY = {
  LOW: { label: 'Low intensity', dots: 1 },
  MEDIUM: { label: 'Medium intensity', dots: 2 },
  HIGH: { label: 'High intensity', dots: 3 },
};

// Times are always shown in the gym's time zone (same as the server's GYM_TIMEZONE),
// so a member travelling abroad still sees "08:00" for an 08:00 class.
export const GYM_TIMEZONE = 'Europe/Istanbul';

const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: GYM_TIMEZONE, hour: '2-digit', minute: '2-digit' });
const dayFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: GYM_TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' });
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: GYM_TIMEZONE }); // "2026-10-24"

// "2026-10-24T05:00:00.000Z" → "08:00"
export const formatTime = (iso) => timeFormatter.format(new Date(iso));

// The calendar day in the gym's time zone, used to group classes: "2026-10-24".
export const dayKey = (isoOrDate) => dayKeyFormatter.format(new Date(isoOrDate));

// "Today", "Tomorrow" or "Saturday 24 October". `now` is passed in (components must not read the clock while rendering).
export function formatDayHeading(iso, now) {
  const key = dayKey(iso);
  if (key === dayKey(now)) return 'Today';
  if (key === dayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000))) return 'Tomorrow';
  return dayFormatter.format(new Date(iso));
}

// "Saturday 24 October"
export const formatLongDay = (iso) => dayFormatter.format(new Date(iso));

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: GYM_TIMEZONE, weekday: 'short' });
const dayNumberFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: GYM_TIMEZONE, day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: GYM_TIMEZONE, month: 'short' });

// Parts for the day picker: { weekday: "Sat", day: "24", month: "Oct" }
export function dayParts(iso) {
  const date = new Date(iso);
  return { weekday: weekdayFormatter.format(date), day: dayNumberFormatter.format(date), month: monthFormatter.format(date) };
}

// How long until a class starts: "in 45 min", "in 3 h 20 min", "in 26 h", "in 3 days". `now` is passed in.
export function formatStartsIn(iso, now) {
  const minutes = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return 'now';
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 10) return minutes % 60 ? `in ${hours} h ${minutes % 60} min` : `in ${hours} h`;
  if (hours < 48) return `in ${hours} h`; // "in 1 day" would hide that it is tomorrow evening, not morning
  const days = Math.round(hours / 24);
  return days === 1 ? 'in 1 day' : `in ${days} days`;
}

// The gym's UTC offset on a given date, e.g. "+03:00" for Istanbul.
function gymUtcOffset(date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: GYM_TIMEZONE, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName').value; // "GMT+03:00" ("GMT" for UTC itself)
  return name === 'GMT' ? 'Z' : name.slice(3);
}

// Date input "2026-10-24" + time input "08:00" (gym time) → "2026-10-24T08:00:00+03:00" for the API.
export function toGymDateTime(date, time) {
  const offset = gymUtcOffset(new Date(`${date}T12:00:00Z`));
  return `${date}T${time}:00${offset}`;
}

// The other way round, to fill the form when editing: ISO moment → { date: "2026-10-24", time: "08:00" }.
export function fromGymDateTime(iso) {
  return { date: dayKey(iso), time: formatTime(iso) };
}

// A class object built from the form values, so the form can show a live preview card.
export function previewClassFromForm(form, trainer) {
  const hasTime = /^\d{4}-\d{2}-\d{2}$/.test(form.date) && /^\d{2}:\d{2}$/.test(form.time);
  const startsAt = hasTime ? new Date(toGymDateTime(form.date, form.time)) : new Date('2026-01-01T06:00:00Z');
  const minutes = Number(form.durationMinutes) || 60;
  const capacity = Number(form.capacity) || 10;
  return {
    id: 0,
    title: form.title || 'Class title',
    category: form.category || 'RUNNING',
    location: form.location || 'Meeting point',
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + minutes * 60 * 1000).toISOString(),
    level: form.level || 'ALL_LEVELS',
    capacity,
    bookedCount: 0,
    spotsLeft: capacity,
    isCancelled: false,
    isBookedByMe: false,
    trainer: trainer ?? { firstName: 'Trainer', lastName: '' },
  };
}

// 75 → "1 h 15 min", 45 → "45 min"
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
