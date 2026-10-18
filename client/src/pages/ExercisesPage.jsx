import { useCallback, useState } from 'react';
import { m } from 'motion/react';
import { Dumbbell, Eye, EyeOff, LayoutGrid, Pencil, Plus, Search } from 'lucide-react';
import { createExercise, listExercises, updateExercise } from '../api/exercises.js';
import { useApiData } from '../hooks/useApiData.js';
import ExerciseForm from '../components/exercises/ExerciseForm.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { Stagger, StaggerItem, TiltCard } from '../components/ui/motion.jsx';
import { useToast } from '../components/ui/useToast.js';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '../utils/exerciseDisplay.js';

const FILTERS = [{ value: '', label: 'All', icon: LayoutGrid }, ...Object.entries(MUSCLE_GROUPS).map(([value, g]) => ({ value, label: g.label, icon: g.icon }))];

// One exercise: a coloured icon tile for its muscle group, the equipment and the how-to text.
function ExerciseCard({ exercise, onEdit, onToggleActive }) {
  const { label, icon: Icon, gradient, soft } = MUSCLE_GROUPS[exercise.muscleGroup];
  return (
    <article className={`flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm ${exercise.isActive ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-4">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{exercise.name}</h2>
          <p className="mt-1 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${soft}`}>{label}</span>
            <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-ink-3">{EQUIPMENT_LABELS[exercise.equipment]}</span>
            {!exercise.isActive && <span className="rounded-full bg-surface-4 px-2 py-0.5 text-xs font-semibold text-ink-2">Inactive</span>}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-3">{exercise.description}</p>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit(exercise)}>
          Edit
        </Button>
        <Button variant={exercise.isActive ? 'danger' : 'secondary'} size="sm" icon={exercise.isActive ? EyeOff : Eye} onClick={() => onToggleActive(exercise)}>
          {exercise.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </article>
  );
}

// Trainers and admins: the exercise library that workout plans are built from.
function ExercisesPage() {
  const showToast = useToast();
  const [muscleGroup, setMuscleGroup] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null); // null, 'new' or an exercise
  const [actionError, setActionError] = useState('');

  // useCallback: a new loader only when a filter changes, so useApiData loads again exactly then.
  const load = useCallback(() => listExercises({ muscleGroup, search: search.trim(), includeInactive: showInactive }), [muscleGroup, search, showInactive]);
  const { data, error, reload } = useApiData(load);

  async function handleSubmit(values) {
    if (editing === 'new') {
      await createExercise(values);
      showToast('Exercise added');
    } else {
      await updateExercise(editing.id, values);
      showToast('Exercise saved');
    }
    setEditing(null);
    reload();
  }

  async function handleToggleActive(exercise) {
    setActionError('');
    try {
      const { id, ...rest } = exercise;
      await updateExercise(id, { ...rest, isActive: !exercise.isActive });
      showToast(exercise.isActive ? 'Exercise deactivated' : 'Exercise activated');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Exercises"
        description="The library that workout plans are built from."
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            New exercise
          </Button>
        }
      />

      {/* Muscle group chips; the dark highlight slides to the chosen one */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by muscle group">
        {FILTERS.map((filter) => {
          const isSelected = filter.value === muscleGroup;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setMuscleGroup(filter.value)}
              className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                isSelected ? 'border-transparent text-surface' : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
              }`}
            >
              {isSelected && <m.span layoutId="muscle-filter-highlight" transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-ink" />}
              <filter.icon className="relative size-4" aria-hidden="true" />
              <span className="relative">{filter.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search exercises…"
            aria-label="Search exercises"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface py-2 pr-3 pl-9 text-ink shadow-sm outline-none transition placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/25"
          />
        </div>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="size-4 accent-brand-700" />
          Show inactive
        </label>
        {data && <span className="text-sm text-muted">{data.exercises.length} exercises</span>}
      </div>

      <ErrorMessage>{error || actionError}</ErrorMessage>

      {!data && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 animate-pulse rounded-2xl bg-surface-3" />
          ))}
        </div>
      )}

      {data?.exercises.length === 0 && (
        <Card>
          <EmptyState icon={Dumbbell} title="No exercises found" description="Try another muscle group or search, or add a new exercise." />
        </Card>
      )}

      {data && data.exercises.length > 0 && (
        <Stagger key={`${muscleGroup}-${showInactive}`} step={0.02} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.exercises.map((exercise) => (
            <StaggerItem key={exercise.id}>
              <TiltCard maxTilt={5} className="h-full">
                <ExerciseCard exercise={exercise} onEdit={setEditing} onToggleActive={handleToggleActive} />
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal isOpen={editing !== null} title={editing === 'new' ? 'New exercise' : 'Edit exercise'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <ExerciseForm
            key={editing === 'new' ? 'new' : editing.id}
            initialExercise={editing === 'new' ? null : editing}
            submitLabel={editing === 'new' ? 'Add exercise' : 'Save changes'}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

export default ExercisesPage;
