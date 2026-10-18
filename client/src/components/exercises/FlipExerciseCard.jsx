import { useState } from 'react';
import { m } from 'motion/react';
import { Eye, EyeOff, Pencil, RotateCw, Undo2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';

// An exercise as a card that turns over in 3D: the front shows what it is,
// the back shows how to do it and the buttons to edit or (de)activate it.
// Both sides are stacked on top of each other; the back is turned 180° and hidden while it faces away
// (backface-visibility: hidden), so turning the card shows the other side.
function FlipExerciseCard({ exercise, onEdit, onToggleActive }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { label, icon: Icon, gradient, soft } = MUSCLE_GROUPS[exercise.muscleGroup];
  const flip = () => setIsFlipped((value) => !value);

  return (
    <div className={`group h-72 [perspective:1200px] ${exercise.isActive ? '' : 'opacity-60'}`}>
      <m.div
        className="relative size-full [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        {/* ---------- Front ---------- */}
        <button
          type="button"
          onClick={flip}
          aria-label={`${exercise.name}: show how to do it`}
          aria-hidden={isFlipped}
          tabIndex={isFlipped ? -1 : 0}
          className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-sm transition-shadow [backface-visibility:hidden] group-hover:shadow-xl"
        >
          <span className={`relative flex h-28 items-end bg-gradient-to-br p-4 ${gradient}`}>
            {/* Big faded icon in the corner and a floating small one: depth */}
            <Icon aria-hidden="true" strokeWidth={1.25} className="absolute -top-3 -right-3 size-32 rotate-12 text-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0" />
            <span className="flex size-12 items-center justify-center rounded-xl bg-white/25 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
              <Icon className="size-6" aria-hidden="true" />
            </span>
          </span>
          <span className="flex flex-1 flex-col p-4">
            <span className="text-lg leading-snug font-semibold text-ink">{exercise.name}</span>
            <span className="mt-2 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${soft}`}>{label}</span>
              <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-ink-3">{EQUIPMENT_LABELS[exercise.equipment]}</span>
              {!exercise.isActive && <span className="rounded-full bg-surface-4 px-2 py-0.5 text-xs font-semibold text-ink-2">Inactive</span>}
            </span>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              <RotateCw className="size-3.5 transition-transform duration-500 group-hover:rotate-180" aria-hidden="true" />
              Tap to see how it's done
            </span>
          </span>
        </button>

        {/* ---------- Back ---------- */}
        <div
          aria-hidden={!isFlipped}
          className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
            {exercise.name}
          </h2>
          <p className="mt-2 flex-1 overflow-y-auto text-sm leading-relaxed text-ink-3">{exercise.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={Pencil} tabIndex={isFlipped ? 0 : -1} onClick={() => onEdit(exercise)}>
              Edit
            </Button>
            <Button
              variant={exercise.isActive ? 'danger' : 'secondary'}
              size="sm"
              icon={exercise.isActive ? EyeOff : Eye}
              tabIndex={isFlipped ? 0 : -1}
              onClick={() => onToggleActive(exercise)}
            >
              {exercise.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="ghost" size="sm" icon={Undo2} tabIndex={isFlipped ? 0 : -1} onClick={flip} aria-label="Turn the card back">
              Back
            </Button>
          </div>
        </div>
      </m.div>
    </div>
  );
}

export default FlipExerciseCard;
