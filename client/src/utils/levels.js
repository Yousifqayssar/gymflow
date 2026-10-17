import { Award, Crown, Medal } from 'lucide-react';

// How each loyalty level looks. The points needed are decided by the server.
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
};

// Points at which each level starts (same as the server), for the progress bar.
export const LEVEL_START = { Bronze: 0, Silver: 100, Gold: 300 };
