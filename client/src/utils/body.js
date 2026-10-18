import { Bike, Dumbbell, HeartPulse, Scale, Sparkles } from 'lucide-react';

// The training goals a member can choose (same values as the server's BodyGoal).
export const GOALS = {
  LOSE_WEIGHT: { label: 'Lose weight', icon: Scale },
  BUILD_MUSCLE: { label: 'Build muscle', icon: Dumbbell },
  GET_FIT: { label: 'Get fit', icon: Sparkles },
  IMPROVE_ENDURANCE: { label: 'Improve endurance', icon: Bike },
  STAY_HEALTHY: { label: 'Stay healthy', icon: HeartPulse },
};

// What a BMI value means, in neutral words (WHO ranges for adults). BMI does not know about
// muscle, so it is only a rough guide – the card says so too.
export function bmiRange(bmi) {
  if (bmi < 18.5) return { label: 'Below the healthy range', tone: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300' };
  if (bmi < 25) return { label: 'Healthy range', tone: 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300' };
  if (bmi < 30) return { label: 'Above the healthy range', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' };
  return { label: 'Well above the healthy range', tone: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' };
}

// "82.4 kg" – one decimal only when needed.
export const formatKg = (kg) => `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
