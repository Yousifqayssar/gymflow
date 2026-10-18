import { Award, BadgePercent, Crown, Gem, Gift, Medal, Ticket, UserRoundPlus } from 'lucide-react';

// How each loyalty level looks. The points needed and the discount are decided by the server
// (server/src/services/points.js); the perks below are given at the front desk.
export const LEVEL_DISPLAY = {
  Bronze: {
    icon: Medal,
    gradient: 'from-amber-700 via-orange-600 to-amber-900',
    chip: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
  },
  Silver: {
    icon: Award,
    gradient: 'from-slate-400 via-slate-500 to-slate-700',
    chip: 'bg-surface-4 text-ink-2',
  },
  Gold: {
    icon: Crown,
    gradient: 'from-yellow-400 via-amber-500 to-yellow-700',
    chip: 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
  },
  Platinum: {
    icon: Gem,
    gradient: 'from-cyan-400 via-sky-600 to-indigo-800',
    chip: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300',
  },
};

// The levels from lowest to highest, with the points where each starts (same as the server)
// and what members get there.
export const LEVELS = [
  {
    name: 'Bronze',
    from: 0,
    discountPercent: 0,
    perks: [{ icon: Gift, text: 'Collect 10 points with every visit' }],
  },
  {
    name: 'Silver',
    from: 100,
    discountPercent: 5,
    perks: [{ icon: BadgePercent, text: '5% off every new membership' }],
  },
  {
    name: 'Gold',
    from: 300,
    discountPercent: 10,
    perks: [
      { icon: BadgePercent, text: '10% off every new membership' },
      { icon: UserRoundPlus, text: '1 free guest pass every month' },
    ],
  },
  {
    name: 'Platinum',
    from: 600,
    discountPercent: 15,
    perks: [
      { icon: BadgePercent, text: '15% off every new membership' },
      { icon: UserRoundPlus, text: '1 free guest pass every month' },
      { icon: Ticket, text: 'A free personal training session' },
    ],
  },
];

// Points at which each level starts, for the progress bar: { Bronze: 0, Silver: 100, … }
export const LEVEL_START = Object.fromEntries(LEVELS.map((level) => [level.name, level.from]));
