import { getMyProgress } from '../api/progress.js';
import { useApiData } from '../hooks/useApiData.js';
import ProgressOverview from '../components/progress/ProgressOverview.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

// Members: how their training is going – streak, workouts per week, exercise progress and personal bests.
function ProgressPage() {
  const { data, error } = useApiData(getMyProgress);

  return (
    <div>
      <PageHeader title="Progress" description="Every workout you save shows up here. Keep the streak going!" />
      <ErrorMessage>{error}</ErrorMessage>
      <ProgressOverview progress={data} emptyText="Start a workout from your plan on the Workouts page – your progress appears after the first one." />
    </div>
  );
}

export default ProgressPage;
