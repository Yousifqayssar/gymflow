import { ArrowUpFromLine, BicepsFlexed, Footprints, HeartPulse, PersonStanding, Shield, Target, Weight } from 'lucide-react';

// How each muscle group looks (same values as the server's MuscleGroup), one place for the whole app.
// `gradient` for the big icon tiles, `soft` for small chips. Tailwind needs full class names written out.
export const MUSCLE_GROUPS = {
  CHEST: { label: 'Chest', icon: Shield, gradient: 'from-rose-400 to-red-600', soft: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
  BACK: { label: 'Back', icon: ArrowUpFromLine, gradient: 'from-sky-400 to-blue-600', soft: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300' },
  LEGS: { label: 'Legs', icon: Footprints, gradient: 'from-amber-400 to-orange-600', soft: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  SHOULDERS: { label: 'Shoulders', icon: Weight, gradient: 'from-violet-400 to-purple-600', soft: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300' },
  ARMS: { label: 'Arms', icon: BicepsFlexed, gradient: 'from-fuchsia-400 to-pink-600', soft: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300' },
  CORE: { label: 'Core', icon: Target, gradient: 'from-teal-400 to-emerald-600', soft: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300' },
  FULL_BODY: { label: 'Full body', icon: PersonStanding, gradient: 'from-indigo-400 to-indigo-700', soft: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300' },
  CARDIO: { label: 'Cardio', icon: HeartPulse, gradient: 'from-red-400 to-rose-700', soft: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' },
};

export const EQUIPMENT_LABELS = {
  BARBELL: 'Barbell',
  DUMBBELL: 'Dumbbells',
  MACHINE: 'Machine',
  CABLE: 'Cable',
  KETTLEBELL: 'Kettlebell',
  BODYWEIGHT: 'Bodyweight',
  BAND: 'Resistance band',
  CARDIO_MACHINE: 'Cardio machine',
};
