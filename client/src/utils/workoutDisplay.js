// Display helpers for workout plans.

// 90 → "1:30 min", 45 → "45 s", 0 → "no rest"
export function formatRest(seconds) {
  if (!seconds) return 'no rest';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}:${String(rest).padStart(2, '0')} min` : `${minutes} min`;
}

// "4 × 8 · 62.5 kg" or "3 × 10" (bodyweight)
export function formatSetsReps({ sets, reps, targetWeightKg }) {
  const base = `${sets} × ${reps}`;
  return targetWeightKg ? `${base} · ${targetWeightKg} kg` : base;
}

// Total number of sets in a day (a rough "how long is this workout" hint).
export const totalSets = (day) => day.exercises.reduce((sum, item) => sum + item.sets, 0);
