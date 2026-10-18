import { useState } from 'react';
import { ChevronDown, MessageSquareText, Timer } from 'lucide-react';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';
import { formatRest, formatSetsReps } from '../../utils/workoutDisplay.js';

// One exercise of a training day: what, how much, how long to rest – the how-to opens on demand.
function PlanExerciseRow({ item, number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { label, icon: Icon, gradient } = MUSCLE_GROUPS[item.exercise.muscleGroup];

  return (
    <li className="rounded-2xl border border-line bg-surface shadow-sm">
      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className="flex w-full items-center gap-4 p-4 text-left">
        <span className="relative shrink-0">
          <span className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-surface">{number}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">{item.exercise.name}</span>
          <span className="block text-xs text-muted">
            {label} · {EQUIPMENT_LABELS[item.exercise.equipment]}
          </span>
        </span>
        <span className="text-right">
          <span className="block font-display text-xl leading-tight font-bold text-ink">{formatSetsReps(item)}</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Timer className="size-3.5" aria-hidden="true" />
            {formatRest(item.restSeconds)} rest
          </span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {(isOpen || item.notes) && (
        <div className="space-y-2 border-t border-line-soft px-4 py-3 text-sm">
          {item.notes && (
            <p className="flex items-start gap-2 text-ink-2">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              {item.notes}
            </p>
          )}
          {isOpen && <p className="leading-relaxed text-ink-3">{item.exercise.description}</p>}
        </div>
      )}
    </li>
  );
}

// The exercises of one training day, in order.
function PlanDayView({ day }) {
  return (
    <ol className="space-y-3">
      {day.exercises.map((item, index) => (
        <PlanExerciseRow key={item.id} item={item} number={index + 1} />
      ))}
    </ol>
  );
}

export default PlanDayView;
