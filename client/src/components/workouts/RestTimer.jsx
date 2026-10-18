import { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { Plus, SkipForward } from 'lucide-react';

const RING = 2 * Math.PI * 44; // circumference of the countdown ring (r = 44)

// Rest between two sets: a ring that empties as the seconds count down. It replaces the title row
// of the session's sticky top bar (same height): it never covers the next set and the page never jumps.
// `endsAt` is a time in ms; the parent can extend it (+15 s). When the time is up the phone
// vibrates (if it can) and `onDone` is called.
function RestTimer({ endsAt, total, onAdd, onDone }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));

  useEffect(() => {
    if (left > 0) return;
    navigator.vibrate?.([200, 100, 200]);
    onDone();
  }, [left, onDone]);

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      role="timer"
      aria-live="off"
      className="flex h-14 items-center gap-3 rounded-2xl bg-slate-950 px-2 text-white ring-1 ring-white/10"
    >
      <svg viewBox="0 0 100 100" className="size-11 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - left / Math.max(total, 1))}
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>
      <div className="flex-1">
        <p className="text-xs text-white/70">Rest</p>
        <p className="font-display text-2xl leading-none font-bold">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onAdd} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-white/10 px-3 text-sm font-semibold hover:bg-white/20">
          <Plus className="size-4" aria-hidden="true" />
          15 s
        </button>
        <button type="button" onClick={onDone} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-brand-400 px-3 text-sm font-semibold text-slate-950 hover:bg-brand-300">
          <SkipForward className="size-4" aria-hidden="true" />
          Skip
        </button>
      </div>
    </m.div>
  );
}

export default RestTimer;
