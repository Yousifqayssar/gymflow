import { ClipboardList, Clock, History, Repeat, Trophy } from 'lucide-react';
import { listMyWorkoutPlans } from '../api/workoutPlans.js';
import { listMyWorkouts } from '../api/workoutLogs.js';
import { formatLongDay } from '../utils/classDisplay.js';
import { useApiData } from '../hooks/useApiData.js';
import PlanCard from '../components/workouts/PlanCard.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

// Members: the workout plans their trainer wrote for them.
function MyWorkoutsPage() {
  const { data, error } = useApiData(listMyWorkoutPlans);
  const { data: history } = useApiData(listMyWorkouts);

  return (
    <div className="space-y-6">
      <PageHeader title="My workouts" description="Your training plans from your trainer. Tap an exercise to see how it's done." />
      <ErrorMessage>{error}</ErrorMessage>
      {!data && !error && <div className="h-96 animate-pulse rounded-3xl bg-surface-3" />}
      {data?.plans.length === 0 && (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No workout plan yet"
            description="Ask a trainer at the gym – they will write a plan that fits your goal. Keep your body details up to date on your profile."
          />
        </Card>
      )}
      {data?.plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} canStart />
      ))}

      {history?.workouts.length > 0 && (
        <Card title="Recent workouts" description={`${history.workouts.length} saved workouts`} padded={false}>
          <ul className="divide-y divide-line-soft">
            {history.workouts.slice(0, 8).map((workout) => (
              <li key={workout.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  <History className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{workout.dayName}</span>
                  <span className="block text-sm text-muted">{formatLongDay(workout.performedAt)}</span>
                </span>
                <span className="flex gap-4 text-sm text-ink-3">
                  <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{Math.round(workout.durationSeconds / 60)} min</span>
                  <span className="inline-flex items-center gap-1"><Repeat className="size-3.5" aria-hidden="true" />{workout.summary.sets} sets</span>
                  <span className="inline-flex items-center gap-1"><Trophy className="size-3.5" aria-hidden="true" />{workout.summary.volumeKg} kg</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default MyWorkoutsPage;
