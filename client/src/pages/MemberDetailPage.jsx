import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getMember } from '../api/members.js';
import { listPlans } from '../api/plans.js';
import AssignMembershipForm from '../components/AssignMembershipForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import MembershipStatusBadge from '../components/MembershipStatusBadge.jsx';
import { formatDate, formatPrice } from '../utils/format.js';
import PageTitle from '../components/ui/PageTitle.jsx';

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
  if (!data) return <p className="text-slate-500">Loading…</p>;

  const { user, status, currentMembership, memberships } = data;
  const isMember = user.role === 'MEMBER';

  return (
    <div className="space-y-4">
      <Link to="/people" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Back to people
      </Link>

      <section className="rounded-2xl bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <PageTitle>{`${user.firstName} ${user.lastName}`}</PageTitle>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-slate-600">{user.email}</p>
            <p className="text-sm text-slate-500">Joined {formatDate(user.createdAt)}</p>
          </div>
          {isMember && <MembershipStatusBadge status={status} />}
        </div>

        {isMember && currentMembership && (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <strong>{currentMembership.plan.name}</strong>: {formatDate(currentMembership.startDate)} –{' '}
            {formatDate(currentMembership.endDate)}
            {currentMembership.status !== 'EXPIRED' && currentMembership.status !== 'UPCOMING' && (
              <> · {currentMembership.daysRemaining} days left</>
            )}
          </div>
        )}
        {!isMember && <p className="mt-4 text-sm text-slate-500">Trainers don't have memberships.</p>}
      </section>

      {isMember && (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Assign a plan</h2>
            <AssignMembershipForm memberId={user.id} plans={plans} onAssigned={() => setReloadCount((n) => n + 1)} />
          </section>

          <section className="rounded-2xl bg-white shadow-md">
            <h2 className="p-5 pb-2 text-lg font-semibold text-slate-900">Membership history</h2>
            {memberships.length === 0 ? (
              <p className="px-5 pb-5 text-slate-500">No memberships yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {memberships.map((membership) => (
                  <li key={membership.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{membership.plan.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">{formatPrice(membership.price)}</span>
                      <MembershipStatusBadge status={membership.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default MemberDetailPage;
