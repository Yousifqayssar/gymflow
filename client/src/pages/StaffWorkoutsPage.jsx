import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ClipboardList, Pencil, Plus, Search, Users } from 'lucide-react';
import { listMembersForStaff, listWorkoutPlans } from '../api/workoutPlans.js';
import { getMemberProgress } from '../api/progress.js';
import ProgressOverview from '../components/progress/ProgressOverview.jsx';
import { useAuth } from '../auth/useAuth.js';
import { useApiData } from '../hooks/useApiData.js';
import MemberGoalSummary from '../components/workouts/MemberGoalSummary.jsx';
import PlanCard from '../components/workouts/PlanCard.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

const SEARCH_DELAY_MS = 300;

// Trainers and admins: choose a member, see their goal and their plans, write or change a plan.
// The chosen member is kept in the URL (?member=4), so the back button and links work.
function StaffWorkoutsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const memberId = Number(searchParams.get('member')) || null;
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // Search after a short pause in typing, not on every key.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const loadMembers = useCallback(() => listMembersForStaff(query), [query]);
  const { data: memberData, error: memberError } = useApiData(loadMembers);
  const loadPlans = useCallback(() => (memberId ? listWorkoutPlans(memberId) : Promise.resolve(null)), [memberId]);
  const { data: planData, error: planError } = useApiData(loadPlans);
  const loadProgress = useCallback(() => (memberId ? getMemberProgress(memberId) : Promise.resolve(null)), [memberId]);
  const { data: progress } = useApiData(loadProgress);

  const members = memberData?.members ?? [];
  const selected = members.find((m) => m.id === memberId) ?? planData?.plans[0]?.member ?? null;
  const canEdit = (plan) => user.role === 'ADMIN' || plan.author?.id === user.id;

  return (
    <div className="space-y-6">
      <PageHeader title="Workouts" description="Choose a member to see their goal and write a training plan for them." />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* ---------- Member list ---------- */}
        <aside className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              type="search"
              placeholder="Find a member…"
              aria-label="Find a member"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-surface py-2 pr-3 pl-9 text-ink shadow-sm outline-none placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/25"
            />
          </div>
          <ErrorMessage>{memberError}</ErrorMessage>
          <ul className="max-h-[32rem] space-y-1 overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-sm" aria-label="Members">
            {!memberData && [1, 2, 3, 4].map((n) => <li key={n} className="h-12 animate-pulse rounded-xl bg-surface-3" />)}
            {memberData && members.length === 0 && <li className="p-3 text-sm text-muted">No member found.</li>}
            {members.map((member) => {
              const isSelected = member.id === memberId;
              return (
                <li key={member.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSearchParams({ member: String(member.id) })}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isSelected ? 'bg-brand-700 text-white' : 'text-ink-2 hover:bg-surface-2'
                    }`}
                  >
                    <Avatar firstName={member.firstName} lastName={member.lastName} avatar={member.avatar} size="sm" />
                    {member.firstName} {member.lastName}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ---------- The chosen member ---------- */}
        <div className="min-w-0 space-y-6">
          {!memberId && (
            <Card>
              <EmptyState icon={Users} title="Choose a member" description="Their goal, body details and workout plans appear here." />
            </Card>
          )}

          {memberId && (
            <>
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                {selected ? <MemberGoalSummary member={selected} /> : <div className="h-40 animate-pulse rounded-2xl bg-surface-3" />}
                <Button as={Link} to={`/workouts/new?member=${memberId}`} icon={Plus} className="xl:mt-1">
                  New plan
                </Button>
              </div>

              <ErrorMessage>{planError}</ErrorMessage>
              {!planData && !planError && <div className="h-80 animate-pulse rounded-3xl bg-surface-3" />}
              {planData?.plans.length === 0 && (
                <Card>
                  <EmptyState icon={ClipboardList} title="No plan yet" description="Write the first plan for this member with “New plan”." />
                </Card>
              )}
              {planData?.plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  actions={
                    canEdit(plan) && (
                      <Button as={Link} to={`/workouts/${plan.id}/edit`} variant="secondary" size="sm" icon={Pencil}>
                        Edit
                      </Button>
                    )
                  }
                />
              ))}

              <section className="pt-4">
                <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">Progress</h2>
                <ProgressOverview progress={progress} emptyText="This member has not saved a workout yet." />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffWorkoutsPage;
