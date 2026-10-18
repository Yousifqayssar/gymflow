import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Dumbbell, Layers, Plus, Search, Wrench } from 'lucide-react';
import { createExercise, listExercises, updateExercise } from '../api/exercises.js';
import { useApiData } from '../hooks/useApiData.js';
import ExerciseForm from '../components/exercises/ExerciseForm.jsx';
import FlipExerciseCard from '../components/exercises/FlipExerciseCard.jsx';
import ExerciseDemo from '../components/exercises/ExerciseDemo.jsx';
import MuscleGroupTiles from '../components/exercises/MuscleGroupTiles.jsx';
import MuscleOrbit from '../components/exercises/MuscleOrbit.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageTitle from '../components/ui/PageTitle.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { AnimatedNumber } from '../components/ui/motion.jsx';
import { useToast } from '../components/ui/useToast.js';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '../utils/exerciseDisplay.js';

// Trainers and admins: the exercise library that workout plans are built from.
// The whole library is loaded once and filtered here, so the tiles can always show every count.
function ExercisesPage() {
  const showToast = useToast();
  const [muscleGroup, setMuscleGroup] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null); // null, 'new' or an exercise
  const [actionError, setActionError] = useState('');
  const [demo, setDemo] = useState(null); // the exercise shown in the 3D demo popup

  const load = useCallback(() => listExercises({ includeInactive: showInactive }), [showInactive]);
  const { data, error, reload } = useApiData(load);
  const all = useMemo(() => data?.exercises ?? [], [data]);

  const counts = useMemo(() => {
    const result = {};
    for (const exercise of all) result[exercise.muscleGroup] = (result[exercise.muscleGroup] ?? 0) + 1;
    return result;
  }, [all]);
  const equipmentCount = new Set(all.map((e) => e.equipment)).size;

  const text = search.trim().toLowerCase();
  const shown = all.filter((e) => (!muscleGroup || e.muscleGroup === muscleGroup) && (!text || e.name.toLowerCase().includes(text)));

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

  const stats = [
    { label: 'Exercises', value: data ? all.length : null, icon: Dumbbell },
    { label: 'Muscle groups', value: Object.keys(MUSCLE_GROUPS).length, icon: Layers },
    { label: 'Equipment types', value: data ? equipmentCount : null, icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      <PageTitle>Exercises</PageTitle>

      {/* ---------- Hero with the 3D orbit ---------- */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_50%,rgb(16_185_129/0.3),transparent_60%)]" />
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-wide text-brand-300 uppercase">Training library</p>
            <h1 className="mt-2 font-display text-5xl leading-none font-bold tracking-tight sm:text-6xl">Exercises</h1>
            <p className="mt-3 text-white/70">Every exercise our trainers build workout plans from – with clear how-to steps for members.</p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {stats.map(({ label, value, icon: Icon }) => (
                <li key={label} className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/15 backdrop-blur-md">
                  <Icon className="size-4 text-brand-300" aria-hidden="true" />
                  <span className="font-display text-2xl leading-none font-bold">{value === null ? '–' : <AnimatedNumber value={value} />}</span>
                  <span className="text-xs text-white/70">{label}</span>
                </li>
              ))}
            </ul>
            <Button icon={Plus} onClick={() => setEditing('new')} className="mt-6">
              New exercise
            </Button>
          </div>
          <div className="hidden md:block">
            <MuscleOrbit />
          </div>
        </div>
      </section>

      {data && <MuscleGroupTiles counts={counts} total={all.length} value={muscleGroup} onChange={setMuscleGroup} />}

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
        {data && (
          <span className="text-sm text-muted" aria-live="polite">
            {shown.length} of {all.length} shown
          </span>
        )}
      </div>

      <ErrorMessage>{error || actionError}</ErrorMessage>

      {!data && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-72 animate-pulse rounded-2xl bg-surface-3" />
          ))}
        </div>
      )}

      {data && shown.length === 0 && (
        <Card>
          <EmptyState icon={Dumbbell} title="No exercises found" description="Try another muscle group or search, or add a new exercise." />
        </Card>
      )}

      {/* Cards glide to their new place when the filter changes ("layout" animation) */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {shown.map((exercise, index) => (
            <m.li
              key={exercise.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: Math.min(index, 12) * 0.03 } }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            >
              <FlipExerciseCard exercise={exercise} onEdit={setEditing} onToggleActive={handleToggleActive} onDemo={setDemo} />
            </m.li>
          ))}
        </AnimatePresence>
      </ul>

      <Modal isOpen={demo !== null} title={demo?.name ?? ''} onClose={() => setDemo(null)}>
        {demo && (
          <div className="space-y-4">
            <ExerciseDemo key={demo.id} exercise={demo} className="h-80 sm:h-96" />
            <p className="flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${MUSCLE_GROUPS[demo.muscleGroup].soft}`}>{MUSCLE_GROUPS[demo.muscleGroup].label}</span>
              <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-ink-3">{EQUIPMENT_LABELS[demo.equipment]}</span>
            </p>
            <p className="text-sm leading-relaxed text-ink-3">{demo.description}</p>
          </div>
        )}
      </Modal>

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
