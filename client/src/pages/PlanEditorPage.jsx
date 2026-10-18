import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { createWorkoutPlan, getWorkoutPlan, listMembersForStaff, updateWorkoutPlan } from '../api/workoutPlans.js';
import MemberGoalSummary from '../components/workouts/MemberGoalSummary.jsx';
import PlanBuilder from '../components/workouts/PlanBuilder.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useToast } from '../components/ui/useToast.js';

// Trainers and admins: write a new plan (/workouts/new?member=4) or change one (/workouts/7/edit).
// The member's goal stays visible next to the form while writing.
function PlanEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const isNew = !id;
  const [state, setState] = useState({ plan: null, member: null, error: '' });

  useEffect(() => {
    let ignore = false;
    const load = isNew
      ? listMembersForStaff().then(({ members }) => {
          const member = members.find((m) => m.id === Number(searchParams.get('member')));
          if (!member) throw new Error('Choose a member first.');
          return { plan: null, member };
        })
      : getWorkoutPlan(id).then(({ plan }) => ({ plan, member: plan.member }));
    load
      .then((result) => {
        if (!ignore) setState({ ...result, error: '' });
      })
      .catch((err) => {
        if (!ignore) setState({ plan: null, member: null, error: err.message });
      });
    return () => {
      ignore = true;
    };
  }, [id, isNew, searchParams]);

  const { plan, member, error } = state;
  const backTo = `/workouts${member ? `?member=${member.id}` : ''}`;

  async function handleSubmit(values) {
    if (isNew) {
      await createWorkoutPlan(values);
      showToast('Workout plan created');
    } else {
      await updateWorkoutPlan(plan.id, values);
      showToast('Workout plan saved');
    }
    navigate(backTo);
  }

  return (
    <div className="space-y-6">
      <Link to={backTo} className="inline-flex min-h-6 items-center gap-1 text-sm font-medium text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to workouts
      </Link>
      <PageHeader title={isNew ? 'New workout plan' : 'Edit workout plan'} description={member ? `For ${member.firstName} ${member.lastName}` : undefined} />
      <ErrorMessage>{error}</ErrorMessage>

      {member && (isNew || plan) && (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <PlanBuilder key={plan?.id ?? 'new'} memberId={member.id} initialPlan={plan} onSubmit={handleSubmit} onCancel={() => navigate(backTo)} />
          <div className="lg:sticky lg:top-24">
            <MemberGoalSummary member={member} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanEditorPage;
