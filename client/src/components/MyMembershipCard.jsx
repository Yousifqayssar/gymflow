import { useEffect, useState } from 'react';
import { getMyMembership } from '../api/me.js';
import ErrorMessage from './ErrorMessage.jsx';
import MembershipStatusBadge from './MembershipStatusBadge.jsx';
import { formatDate } from '../utils/format.js';

// A hint for the member, depending on their status.
const HINTS = {
  EXPIRING_SOON: 'Your membership ends soon. Ask at the front desk to renew it.',
  EXPIRED: 'Your membership has ended. Ask at the front desk to renew it.',
  NONE: 'You don’t have a membership yet. Ask at the front desk to choose a plan.',
};

// The logged-in member's membership: status, plan, dates and days left.
function MyMembershipCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    getMyMembership()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!data) return <p className="text-slate-500">Loading your membership…</p>;

  const { status, currentMembership: current, memberships } = data;
  // A renewal that starts after the current membership.
  const next = memberships.find((m) => m.status === 'UPCOMING' && m.id !== current?.id);
  const isValidToday = status === 'ACTIVE' || status === 'EXPIRING_SOON';

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">My membership</h2>
        <MembershipStatusBadge status={status} />
      </div>

      {current && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-slate-900">{current.plan.name}</p>
            <p className="text-slate-600">
              {formatDate(current.startDate)} – {formatDate(current.endDate)}
            </p>
          </div>
          {isValidToday && (
            <div className="text-right">
              <p className={`text-4xl font-bold ${status === 'EXPIRING_SOON' ? 'text-amber-600' : 'text-slate-900'}`}>
                {current.daysRemaining}
              </p>
              <p className="text-sm text-slate-500">{current.daysRemaining === 1 ? 'day left' : 'days left'}</p>
            </div>
          )}
        </div>
      )}

      {next && (
        <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Renewed: <strong>{next.plan.name}</strong> starts on {formatDate(next.startDate)}.
        </p>
      )}

      {HINTS[status] && !next && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            status === 'NONE' ? 'bg-slate-50 text-slate-700' : 'bg-amber-50 text-amber-800'
          }`}
        >
          {HINTS[status]}
        </p>
      )}
    </section>
  );
}

export default MyMembershipCard;
