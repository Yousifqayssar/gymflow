import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { CalendarClock, ChevronLeft, History, Mail } from 'lucide-react';
import { getMember } from '../api/members.js';
import { listPlans } from '../api/plans.js';
import AssignMembershipForm from '../components/AssignMembershipForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import MembershipStatusBadge from '../components/MembershipStatusBadge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageTitle from '../components/ui/PageTitle.jsx';
import { formatDate, formatMemberNumber, formatPrice } from '../utils/format.js';

// Admin page for one member: current membership, assign a new plan, and history.
function MemberDetailPage() {
  const { id } = useParams(); // from the URL /people/:id
  const [data, setData] = useState(null); // { user, status, currentMembership, memberships }
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([getMember(id), listPlans()])
      .then(([member, planData]) => {
        if (ignore) return;
        setData(member);
        setPlans(planData.plans.filter((plan) => plan.isActive));
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [id, reloadCount]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!data) return <div className="h-40 animate-pulse rounded-2xl bg-surface-3" aria-label="Loading" />;

  const { user, status, currentMembership, memberships } = data;
  const isMember = user.role === 'MEMBER';

  return (
    <div className="space-y-6">
      <PageTitle>{`${user.firstName} ${user.lastName}`}</PageTitle>
      <Link to="/people" className="inline-flex items-center gap-1 text-sm font-medium text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to people
      </Link>

      {/* ---------- Who it is ---------- */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="font-mono">{formatMemberNumber(user.id)}</span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-4" aria-hidden="true" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4" aria-hidden="true" />
                Joined {formatDate(user.createdAt)}
              </span>
            </p>
          </div>
          {isMember && <MembershipStatusBadge status={status} />}
        </div>

        {isMember && currentMembership && (
          <div className="mt-5 rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-2">
            <strong className="text-ink">{currentMembership.plan.name}</strong>: {formatDate(currentMembership.startDate)} –{' '}
            {formatDate(currentMembership.endDate)}
            {currentMembership.status !== 'EXPIRED' && currentMembership.status !== 'UPCOMING' && (
              <> · {currentMembership.daysRemaining} days left</>
            )}
          </div>
        )}
        {!isMember && <p className="mt-4 text-sm text-muted">Trainers don't have memberships.</p>}
      </Card>

      {isMember && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Assign a plan" description="Starts today, or right after the current membership – unless you pick a date.">
            <AssignMembershipForm memberId={user.id} plans={plans} onAssigned={() => setReloadCount((n) => n + 1)} />
          </Card>

          <Card title="Membership history" padded={false}>
            {memberships.length === 0 ? (
              <EmptyState icon={History} title="No memberships yet" description="Assign the first plan on the left." />
            ) : (
              <ul className="divide-y divide-line-soft">
                {memberships.map((membership) => (
                  <li key={membership.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3">
                    <div>
                      <p className="font-medium text-ink">{membership.plan.name}</p>
                      <p className="text-sm text-muted">
                        {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-ink-3">
                        {formatPrice(membership.price)}
                        {membership.discountPercent > 0 && <span className="ml-1 text-xs text-brand-700 dark:text-brand-300">(−{membership.discountPercent}%)</span>}
                      </span>
                      <MembershipStatusBadge status={membership.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default MemberDetailPage;
