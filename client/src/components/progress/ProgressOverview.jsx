import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CalendarCheck, Clock, Dumbbell, Flame, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import ProgressLine from '../charts/ProgressLine.jsx';
import WeeklyBars from '../charts/WeeklyBars.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import StatCard from '../ui/StatCard.jsx';
import { Stagger, StaggerItem } from '../ui/motion.jsx';
import { MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';
import { formatDate } from '../../utils/format.js';

// "62.5 kg × 5" or "12 reps"
const formatBest = (best) => (best.weightKg ? `${best.weightKg} kg × ${best.reps}` : `${best.reps} reps`);

// Workout progress: totals and streak, workouts per week, one exercise over time, personal bests.
// `progress` comes from GET /api/me/progress or GET /api/members/:id/progress.
// `emptyText` explains what to do when there are no workouts yet (members vs trainers).
function ProgressOverview({ progress, emptyText }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!progress) return <div className="h-96 animate-pulse rounded-3xl bg-surface-3" />;

  const { totals, weeks, exercises } = progress;
  if (totals.workouts === 0) {
    return (
      <Card>
        <EmptyState icon={TrendingUp} title="No workouts yet" description={emptyText} />
      </Card>
    );
  }

  const selected = exercises.find((e) => e.exerciseId === selectedId) ?? exercises[0];
  const stats = [
    { label: totals.streakWeeks === 1 ? 'week streak' : 'weeks in a row', value: totals.streakWeeks, icon: Flame, tone: 'amber' },
    { label: 'Workouts', value: totals.workouts, icon: CalendarCheck, tone: 'brand' },
    { label: 'kg lifted', value: totals.volumeKg, icon: Dumbbell, tone: 'blue' },
    { label: 'Hours trained', value: Math.round((totals.minutes / 60) * 10) / 10, icon: Clock, tone: 'slate' },
  ];
  const bests = [...exercises].sort((a, b) => b.personalBest.date.localeCompare(a.personalBest.date)).slice(0, 6);

  return (
    <div className="@container space-y-6">
      <Stagger className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <StatCard {...stat} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid grid-cols-1 gap-6 @4xl:grid-cols-5">
        <Card className="min-w-0 @4xl:col-span-2" title="Workouts per week" description="The last 8 weeks">
          <WeeklyBars weeks={weeks} />
        </Card>

        <Card className="min-w-0 @4xl:col-span-3" title="Exercise progress" description="Tap an exercise to see how it improved">
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {exercises.map((exercise) => {
              const { icon: Icon } = MUSCLE_GROUPS[exercise.muscleGroup];
              const isSelected = exercise.exerciseId === selected.exerciseId;
              return (
                <button
                  key={exercise.exerciseId}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(exercise.exerciseId)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
                    isSelected ? 'border-transparent bg-ink text-surface' : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {exercise.name}
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <m.div key={selected.exerciseId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">{selected.sessions.length} workouts</span>
                {selected.improvementPercent !== 0 && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      selected.improvementPercent > 0 ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-surface-3 text-ink-3'
                    }`}
                  >
                    {selected.improvementPercent > 0 ? <TrendingUp className="size-3.5" aria-hidden="true" /> : <TrendingDown className="size-3.5" aria-hidden="true" />}
                    {selected.improvementPercent > 0 ? '+' : ''}
                    {selected.improvementPercent}% since the first workout
                  </span>
                )}
              </div>
              <ProgressLine exercise={selected} />
            </m.div>
          </AnimatePresence>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-3xl font-bold tracking-tight text-ink">
          <Trophy className="size-7 text-amber-500" aria-hidden="true" />
          Personal bests
        </h2>
        <Stagger className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {bests.map((exercise) => {
            const { icon: Icon, gradient } = MUSCLE_GROUPS[exercise.muscleGroup];
            return (
              <StaggerItem key={exercise.exerciseId}>
                <article className="relative isolate flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm">
                  <Trophy aria-hidden="true" strokeWidth={1} className="absolute -right-3 -bottom-4 -z-10 size-24 text-amber-400/15" />
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{exercise.name}</span>
                    <span className="block font-display text-2xl leading-tight font-bold text-ink">{formatBest(exercise.personalBest)}</span>
                    <span className="block text-xs text-muted">
                      {exercise.personalBest.estimatedMaxKg ? `≈ ${exercise.personalBest.estimatedMaxKg} kg max · ` : ''}
                      {formatDate(exercise.personalBest.date)}
                    </span>
                  </span>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>
    </div>
  );
}

export default ProgressOverview;
