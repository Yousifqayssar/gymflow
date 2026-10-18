import { Check, Lock } from 'lucide-react';
import { m } from 'motion/react';
import { LEVEL_DISPLAY, LEVELS } from '../utils/levels.js';

// The four loyalty levels as a ladder: what each level gives, which ones the member reached,
// and their current level glowing. `points` and `level` come from GET /api/me/visits.
function RewardsLadder({ points, level }) {
  const currentIndex = LEVELS.findIndex((l) => l.name === level);

  return (
    <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {LEVELS.map((tier, index) => {
        const { icon: Icon, gradient } = LEVEL_DISPLAY[tier.name];
        const isCurrent = index === currentIndex;
        const isReached = index <= currentIndex;
        return (
          <m.li
            key={tier.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm ${
              isCurrent ? 'border-transparent ring-2 ring-brand-500 shadow-lg shadow-brand-500/20' : 'border-line'
            } ${isReached ? '' : 'opacity-75'}`}
          >
            <div className={`relative isolate flex items-center justify-between bg-gradient-to-br px-5 py-4 text-white ${gradient}`}>
              <Icon aria-hidden="true" strokeWidth={1.25} className="absolute -right-3 -bottom-5 -z-10 size-24 -rotate-12 text-white/20" />
              <div>
                <p className="font-display text-2xl font-bold tracking-tight">{tier.name}</p>
                <p className="text-sm text-white/80">{tier.from === 0 ? 'From your first visit' : `From ${tier.from} points`}</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                {isReached ? <Check className="size-5" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
              {isCurrent && (
                <span className="self-start rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
                  Your level
                </span>
              )}
              {!isReached && (
                <span className="self-start rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-ink-3">
                  {tier.from - points} points to go
                </span>
              )}
              <ul className="space-y-2.5">
                {tier.perks.map((perk) => (
                  <li key={perk.text} className="flex items-start gap-2.5 text-sm text-ink-2">
                    <perk.icon className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                    {perk.text}
                  </li>
                ))}
              </ul>
            </div>
          </m.li>
        );
      })}
    </ol>
  );
}

export default RewardsLadder;
