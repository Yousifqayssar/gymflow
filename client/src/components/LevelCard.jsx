import { Sparkles } from 'lucide-react';
import { LEVEL_DISPLAY, LEVEL_START } from '../utils/levels.js';

// The member's loyalty level as a card in the level's own colours (bronze, silver, gold),
// with the points and the progress to the next level. `visits` comes from GET /api/me/visits.
function LevelCard({ visits }) {
  if (!visits) return <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />;

  const { points, level, nextLevel, pointsToNextLevel } = visits;
  const { icon: Icon, gradient } = LEVEL_DISPLAY[level];
  const progress = nextLevel
    ? Math.round(((points - LEVEL_START[level]) / (LEVEL_START[nextLevel] - LEVEL_START[level])) * 100)
    : 100;

  return (
    <section className={`relative isolate overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg ${gradient}`}>
      <Icon aria-hidden="true" strokeWidth={1.25} className="absolute -right-6 -bottom-8 -z-10 size-40 -rotate-12 text-white/20" />
      <div aria-hidden="true" className="absolute -top-12 -left-12 -z-10 size-40 rounded-full bg-white/10" />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">Loyalty level</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
          <Icon className="size-4" aria-hidden="true" />
          {level}
        </span>
      </div>

      <p className="mt-5 flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight">{points}</span>
        <span className="text-white/80">points</span>
      </p>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to the next level"
      >
        <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-white/90">
        <Sparkles className="size-4" aria-hidden="true" />
        {nextLevel ? `${pointsToNextLevel} points to ${nextLevel}` : 'Top level reached – thank you for training with us!'}
      </p>
      <p className="mt-1 text-xs text-white/70">10 points for every visit (once per day)</p>
    </section>
  );
}

export default LevelCard;
