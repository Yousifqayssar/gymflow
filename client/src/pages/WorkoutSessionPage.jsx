import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, Dumbbell, Flag, Info, Repeat, Trophy, X } from 'lucide-react';
import { getWorkoutPlan } from '../api/workoutPlans.js';
import { logWorkout } from '../api/workoutLogs.js';
import RestTimer from '../components/workouts/RestTimer.jsx';
import SetRow from '../components/workouts/SetRow.jsx';
import ExerciseDemo from '../components/exercises/ExerciseDemo.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageTitle from '../components/ui/PageTitle.jsx';
import { AnimatedNumber } from '../components/ui/motion.jsx';
import { useToast } from '../components/ui/useToast.js';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '../utils/exerciseDisplay.js';
import { formatRest, formatSetsReps } from '../utils/workoutDisplay.js';

// The workout in progress is kept in the browser, so a reload (or a phone locking) loses nothing.
const storageKey = (dayId) => `gymflow_workout_${dayId}`;
function readSaved(dayId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(dayId)));
  } catch {
    return null;
  }
}
function writeSaved(dayId, value) {
  try {
    if (value) localStorage.setItem(storageKey(dayId), JSON.stringify(value));
    else localStorage.removeItem(storageKey(dayId));
  } catch {
    // Storage blocked: the workout still works, it is just not kept over a reload.
  }
}

const hasWeight = (item) => item.targetWeightKg !== null;

// A new session: every set of the plan, filled in with the trainer's targets.
function freshSession(day) {
  return {
    startedAt: Date.now(),
    current: 0,
    entries: Object.fromEntries(
      day.exercises.map((item) => [item.id, Array.from({ length: item.sets }, () => ({ reps: item.reps, weightKg: item.targetWeightKg, done: false }))]),
    ),
  };
}

const formatClock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Members: do one training day of a plan – set by set, with a rest timer – and save it.
function WorkoutSessionPage() {
  const { planId, dayId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [plan, setPlan] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [session, setSession] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [rest, setRest] = useState(null); // { endsAt, total }
  const [showHowTo, setShowHowTo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // the saved workout (summary screen)

  useEffect(() => {
    let ignore = false;
    getWorkoutPlan(planId)
      .then(({ plan: loaded }) => {
        if (ignore) return;
        const day = loaded.days.find((d) => d.id === Number(dayId));
        if (!day) throw new Error('This training day does not exist any more.');
        setPlan(loaded);
        setSession(readSaved(day.id) ?? freshSession(day));
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [planId, dayId]);

  // The running clock.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keep the session in the browser after every change.
  useEffect(() => {
    if (session && !result) writeSaved(Number(dayId), session);
  }, [session, dayId, result]);

  // The summary starts at the top of the page (not where the last set was).
  useEffect(() => {
    if (result) window.scrollTo({ top: 0 });
  }, [result]);

  const endRest = useCallback(() => setRest(null), []);

  if (loadError) {
    return (
      <div className="space-y-4">
        <ErrorMessage>{loadError}</ErrorMessage>
        <Button as={Link} to="/workouts" variant="secondary">
          Back to my workouts
        </Button>
      </div>
    );
  }
  if (!plan || !session) return <div className="h-96 animate-pulse rounded-3xl bg-surface-3" />;

  const day = plan.days.find((d) => d.id === Number(dayId));
  const elapsed = Math.max(0, Math.round((now - session.startedAt) / 1000));

  if (result) return <WorkoutSummary workout={result} />;

  const item = day.exercises[session.current];
  const entries = session.entries[item.id];
  const allEntries = day.exercises.flatMap((e) => session.entries[e.id]);
  const doneCount = allEntries.filter((e) => e.done).length;
  const { label, icon: Icon, gradient } = MUSCLE_GROUPS[item.exercise.muscleGroup];

  const updateEntry = (index, changes) =>
    setSession((s) => ({ ...s, entries: { ...s.entries, [item.id]: s.entries[item.id].map((e, i) => (i === index ? { ...e, ...changes } : e)) } }));

  function toggleDone(index) {
    const willBeDone = !entries[index].done;
    updateEntry(index, { done: willBeDone });
    const isLastSetOverall = willBeDone && doneCount + 1 === allEntries.length;
    if (willBeDone && item.restSeconds > 0 && !isLastSetOverall) {
      setRest({ endsAt: Date.now() + item.restSeconds * 1000, total: item.restSeconds });
    }
    // All sets of this exercise done: move on to the next one by itself.
    if (willBeDone && entries.every((e, i) => i === index || e.done) && session.current < day.exercises.length - 1) {
      setTimeout(() => goTo(session.current + 1), 600);
    }
  }

  function goTo(index) {
    setShowHowTo(false);
    setSession((s) => ({ ...s, current: index }));
  }

  async function finish() {
    const sets = day.exercises.flatMap((e) =>
      session.entries[e.id]
        .map((entry, i) => ({ entry, setNumber: i + 1 }))
        .filter(({ entry }) => entry.done)
        .map(({ entry, setNumber }) => ({ exerciseId: e.exercise.id, setNumber, reps: entry.reps, weightKg: hasWeight(e) ? entry.weightKg : null })),
    );
    if (sets.length === 0) {
      setError('Tick off at least one set before finishing.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const { workout } = await logWorkout({ planId: plan.id, dayId: day.id, durationSeconds: elapsed, sets });
      writeSaved(day.id, null);
      setRest(null);
      setResult(workout);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function discard() {
    if (!window.confirm('Stop this workout without saving it?')) return;
    writeSaved(day.id, null);
    showToast('Workout discarded');
    navigate('/workouts');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-10">
      <PageTitle>{`Workout · ${day.name}`}</PageTitle>

      {/* ---------- Top bar: day, clock, progress ---------- */}
      {/* While resting, the rest timer takes the place of the title row – same height, so the page never jumps. */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        {rest ? (
          <RestTimer key={rest.endsAt - rest.total * 1000} endsAt={rest.endsAt} total={rest.total} onAdd={() => setRest((r) => ({ endsAt: r.endsAt + 15000, total: r.total + 15 }))} onDone={endRest} />
        ) : (
        <div className="flex h-14 items-center gap-3">
          <button type="button" onClick={discard} aria-label="Stop without saving" className="rounded-lg p-2 text-muted hover:bg-surface-3 hover:text-ink">
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{day.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted tabular-nums">
              <Clock className="size-3.5" aria-hidden="true" />
              {formatClock(elapsed)} · {doneCount}/{allEntries.length} sets
            </p>
          </div>
          <Button icon={Flag} onClick={finish} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Finish'}
          </Button>
        </div>
        )}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
          <m.div className="h-full rounded-full bg-brand-600" animate={{ width: `${(doneCount / allEntries.length) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      {/* ---------- Exercise steps ---------- */}
      <ol className="flex gap-2 overflow-x-auto pb-1" aria-label="Exercises">
        {day.exercises.map((e, index) => {
          const done = session.entries[e.id].every((s) => s.done);
          const started = session.entries[e.id].some((s) => s.done);
          const isCurrent = index === session.current;
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium whitespace-nowrap transition ${
                  isCurrent ? 'border-brand-600 bg-brand-700 text-white' : done ? 'border-brand-500/40 bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300' : 'border-line bg-surface text-ink-3'
                }`}
              >
                <span className={`size-2 rounded-full ${done ? 'bg-brand-400' : started ? 'bg-amber-400' : isCurrent ? 'bg-white' : 'bg-surface-4'}`} aria-hidden="true" />
                {index + 1}. {e.exercise.name}
              </button>
            </li>
          );
        })}
      </ol>

      {/* ---------- The current exercise ---------- */}
      <AnimatePresence mode="wait">
        <m.section key={item.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }} className="space-y-4">
          <div className={`relative isolate overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg ${gradient}`}>
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/40 to-transparent" />
            <Icon aria-hidden="true" strokeWidth={1.25} className="absolute -right-6 -bottom-8 -z-10 size-48 text-white/20" />
            <p className="text-sm font-medium text-white/85">
              Exercise {session.current + 1} of {day.exercises.length} · {label} · {EQUIPMENT_LABELS[item.exercise.equipment]}
            </p>
            <h1 className="mt-1 font-display text-4xl leading-tight font-bold tracking-tight">{item.exercise.name}</h1>
            <p className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 backdrop-blur-sm">
                <Repeat className="size-4" aria-hidden="true" />
                {formatSetsReps(item)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 backdrop-blur-sm">
                <Clock className="size-4" aria-hidden="true" />
                {formatRest(item.restSeconds)} rest
              </span>
            </p>
            {item.notes && <p className="mt-3 text-sm text-white/90">“{item.notes}”</p>}
          </div>

          <button type="button" onClick={() => setShowHowTo((v) => !v)} aria-expanded={showHowTo} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300">
            <Info className="size-4" aria-hidden="true" />
            {showHowTo ? 'Hide how to do it' : 'How to do it (3D demo)'}
          </button>
          {showHowTo && (
            <div className="space-y-3">
              <ExerciseDemo key={item.exercise.id} exercise={item.exercise} className="h-72" />
              <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-ink-2">{item.exercise.description}</p>
            </div>
          )}

          <ol className="space-y-2">
            {entries.map((entry, index) => (
              <SetRow key={index} number={index + 1} entry={entry} hasWeight={hasWeight(item)} onChange={(changes) => updateEntry(index, changes)} onToggleDone={() => toggleDone(index)} />
            ))}
          </ol>

          <div className="flex justify-between gap-3">
            <Button variant="secondary" icon={ChevronLeft} disabled={session.current === 0} onClick={() => goTo(session.current - 1)}>
              Previous
            </Button>
            {session.current < day.exercises.length - 1 ? (
              <Button variant="secondary" onClick={() => goTo(session.current + 1)}>
                Next exercise
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button icon={Flag} onClick={finish} disabled={isSaving}>
                Finish workout
              </Button>
            )}
          </div>
        </m.section>
      </AnimatePresence>

    </div>
  );
}

// After saving: the numbers of the workout and a small celebration.
function WorkoutSummary({ workout }) {
  const tiles = [
    { label: 'Minutes', value: Math.round(workout.durationSeconds / 60), icon: Clock },
    { label: 'Sets', value: workout.summary.sets, icon: Repeat },
    { label: 'Reps', value: workout.summary.reps, icon: Dumbbell },
    { label: 'kg lifted', value: workout.summary.volumeKg, icon: Trophy },
  ];
  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <PageTitle>Workout saved</PageTitle>
      <div className="relative mx-auto flex size-28 items-center justify-center">
        {/* Little dots bursting out of the trophy */}
        {Array.from({ length: 14 }, (_, i) => {
          const angle = (i / 14) * Math.PI * 2;
          return (
            <m.span
              key={i}
              aria-hidden="true"
              className={`absolute size-2.5 rounded-full ${['bg-brand-400', 'bg-amber-400', 'bg-sky-400'][i % 3]}`}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(angle) * 90, y: Math.sin(angle) * 90, opacity: 0, scale: 0.4 }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
            />
          );
        })}
        <m.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-white shadow-xl"
        >
          <Trophy className="size-14" aria-hidden="true" />
        </m.span>
      </div>
      <div>
        <h1 className="font-display text-5xl font-bold tracking-tight text-ink">Workout done!</h1>
        <p className="mt-2 text-muted">{workout.dayName} is saved. Great job – keep it up.</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon }) => (
          <li key={label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <Icon className="mx-auto size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <p className="mt-2 font-display text-3xl font-bold text-ink">
              <AnimatedNumber value={value} />
            </p>
            <p className="text-xs text-muted">{label}</p>
          </li>
        ))}
      </ul>
      <Button as={Link} to="/workouts">
        Back to my workouts
      </Button>
    </div>
  );
}

export default WorkoutSessionPage;
