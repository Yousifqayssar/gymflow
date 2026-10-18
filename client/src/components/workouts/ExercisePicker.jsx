import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { listExercises } from '../../api/exercises.js';
import { useApiData } from '../../hooks/useApiData.js';
import Modal from '../ui/Modal.jsx';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';

const GROUP_FILTERS = [['', 'All'], ...Object.entries(MUSCLE_GROUPS).map(([value, g]) => [value, g.label])];

// A popup to choose an exercise from the library (active exercises only), with muscle filter and search.
function ExercisePicker({ isOpen, onClose, onPick }) {
  const { data } = useApiData(listExercises);
  const [muscleGroup, setMuscleGroup] = useState('');
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (data?.exercises ?? []).filter((e) => (!muscleGroup || e.muscleGroup === muscleGroup) && (!text || e.name.toLowerCase().includes(text)));
  }, [data, muscleGroup, search]);

  return (
    <Modal isOpen={isOpen} title="Add an exercise" onClose={onClose}>
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search exercises…"
            aria-label="Search exercises"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface py-2 pr-3 pl-9 text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/25"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Filter by muscle group">
          {GROUP_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={muscleGroup === value}
              onClick={() => setMuscleGroup(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${muscleGroup === value ? 'bg-ink text-surface' : 'bg-surface-3 text-ink-3 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="max-h-[50vh] divide-y divide-line-soft overflow-y-auto rounded-xl border border-line">
          {!data && <li className="h-32 animate-pulse bg-surface-3" />}
          {data && shown.length === 0 && <li className="p-4 text-sm text-muted">No exercise matches.</li>}
          {shown.map((exercise) => {
            const { icon: Icon, gradient, label } = MUSCLE_GROUPS[exercise.muscleGroup];
            return (
              <li key={exercise.id}>
                <button type="button" onClick={() => onPick(exercise)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${gradient}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{exercise.name}</span>
                    <span className="block text-xs text-muted">
                      {label} · {EQUIPMENT_LABELS[exercise.equipment]}
                    </span>
                  </span>
                  <Plus className="size-4 text-brand-700 dark:text-brand-300" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}

export default ExercisePicker;
