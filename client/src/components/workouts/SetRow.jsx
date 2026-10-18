import { m } from 'motion/react';
import { Check, Minus, Plus } from 'lucide-react';

// A − value + control with big buttons that are easy to hit with sweaty fingers.
function Stepper({ label, value, step, unit, onChange, disabled }) {
  const change = (delta) => onChange(Math.max(0, Math.round((value + delta) * 10) / 10));
  return (
    <div className="flex items-center gap-1">
      <button type="button" disabled={disabled} onClick={() => change(-step)} aria-label={`Less ${label}`} className="flex size-11 items-center justify-center rounded-xl bg-surface-3 text-ink-2 hover:bg-surface-4 disabled:opacity-40">
        <Minus className="size-4" />
      </button>
      <span className="w-16 text-center">
        <span className="block font-display text-2xl leading-none font-bold text-ink tabular-nums">{value}</span>
        <span className="text-[11px] text-muted">{unit}</span>
      </span>
      <button type="button" disabled={disabled} onClick={() => change(step)} aria-label={`More ${label}`} className="flex size-11 items-center justify-center rounded-xl bg-surface-3 text-ink-2 hover:bg-surface-4 disabled:opacity-40">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

// One set: reps, weight (unless bodyweight) and a big tick to mark it as done.
function SetRow({ number, entry, hasWeight, onChange, onToggleDone }) {
  return (
    <m.li
      layout
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border p-3 transition-colors ${
        entry.done ? 'border-brand-500/40 bg-brand-50 dark:bg-brand-500/10' : 'border-line bg-surface'
      }`}
    >
      <span className="w-12 text-sm font-semibold text-muted">Set {number}</span>
      <Stepper label="reps" value={entry.reps} step={1} unit="reps" disabled={entry.done} onChange={(reps) => onChange({ reps })} />
      {hasWeight && <Stepper label="weight" value={entry.weightKg ?? 0} step={2.5} unit="kg" disabled={entry.done} onChange={(weightKg) => onChange({ weightKg })} />}
      <button
        type="button"
        onClick={onToggleDone}
        aria-pressed={entry.done}
        aria-label={entry.done ? `Set ${number} done – tap to undo` : `Mark set ${number} as done`}
        className={`ml-auto flex size-14 items-center justify-center rounded-2xl text-white shadow-md transition active:scale-95 ${entry.done ? 'bg-brand-700' : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700'}`}
      >
        <m.span key={String(entry.done)} initial={{ scale: 0.4, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
          <Check className="size-7" strokeWidth={3} aria-hidden="true" />
        </m.span>
      </button>
    </m.li>
  );
}

export default SetRow;
