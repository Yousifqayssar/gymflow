import { ClipboardList } from 'lucide-react';
import { listMyWorkoutPlans } from '../api/workoutPlans.js';
import { useApiData } from '../hooks/useApiData.js';
import PlanCard from '../components/workouts/PlanCard.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

// Members: the workout plans their trainer wrote for them.
function MyWorkoutsPage() {
  const { data, error } = useApiData(listMyWorkoutPlans);

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
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}

export default MyWorkoutsPage;
