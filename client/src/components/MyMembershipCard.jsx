import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { getMyMembership } from '../api/me.js';
import { useAuth } from '../auth/useAuth.js';
import ErrorMessage from './ErrorMessage.jsx';
import MembershipStatusBadge from './MembershipStatusBadge.jsx';
import Logo from './ui/Logo.jsx';
import { formatDate, formatMemberNumber } from '../utils/format.js';
import { AnimatedNumber, ProgressFill } from './ui/motion.jsx';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// A hint for the member, depending on their status.
const HINTS = {
  EXPIRING_SOON: 'Your membership ends soon. Renew it online on the Membership page or at the front desk.',
  EXPIRED: 'Your membership has ended. Renew it online on the Membership page or at the front desk.',
  NONE: 'You don’t have a membership yet. Choose a plan on the Membership page or at the front desk.',
  // UPCOMING gets its own hint with the start date (see below).
};

// Length of a membership in days (both dates inclusive), from "YYYY-MM-DD" strings.
function totalDays(membership) {
  return Math.round((new Date(membership.endDate) - new Date(membership.startDate)) / MS_PER_DAY) + 1;
}

// The logged-in member's membership, designed like a physical gym membership card.
function MyMembershipCard() {
  const { user } = useAuth();
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
  if (!data) return <div className="h-56 animate-pulse rounded-2xl bg-surface-4" aria-label="Loading your membership" />;

  const { status, currentMembership: current, memberships } = data;
  const isValidToday = status === 'ACTIVE' || status === 'EXPIRING_SOON';
  const isUpcoming = status === 'UPCOMING';

  // Card colour: green = valid today, blue = starts later (same as the "Upcoming" badge), grey = no valid membership.
  const cardColor = isValidToday
    ? 'from-brand-600 to-brand-900'
    : isUpcoming
      ? 'from-blue-500 to-blue-800'
      : 'from-slate-600 to-slate-800';

  const hint = isUpcoming ? `Your membership starts on ${formatDate(current.startDate)}.` : HINTS[status];
  // A renewal that starts after the current membership.
  const next = memberships.find((m) => m.status === 'UPCOMING' && m.id !== current?.id);

  // Share of the membership already used, for the progress bar (0–100).
  const usedPercent = isValidToday
    ? Math.round(((totalDays(current) - current.daysRemaining) / totalDays(current)) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg ${cardColor}`}>
        {/* Decorative circles, like on a printed card */}
        <div aria-hidden="true" className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute -bottom-20 left-1/3 size-48 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-4">
          <Logo inverted />
          <MembershipStatusBadge status={status} />
        </div>

        <div className="relative mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-white/70">Plan</p>
            <p className="font-display text-3xl font-bold">{current ? current.plan.name : 'No membership'}</p>
            {current && (
              <p className="mt-1 text-sm text-white/80">
                {formatDate(current.startDate)} – {formatDate(current.endDate)}
              </p>
            )}
          </div>
          {isValidToday && (
            <div className="text-right">
              <p className="font-display text-6xl font-bold leading-none">
                <AnimatedNumber value={current.daysRemaining} />
              </p>
              <p className="mt-1 text-sm text-white/80">{current.daysRemaining === 1 ? 'day left' : 'days left'}</p>
            </div>
          )}
          {isUpcoming && (
            <div className="text-right">
              <p className="text-sm text-white/80">Starts in</p>
              <p className="font-display text-6xl font-bold leading-none">{current.daysUntilStart}</p>
              <p className="mt-1 text-sm text-white/80">{current.daysUntilStart === 1 ? 'day' : 'days'}</p>
            </div>
          )}
        </div>

        {isValidToday && (
          <div
            className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuenow={usedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Part of the membership already used"
          >
            <ProgressFill percent={usedPercent} className="bg-white" />
          </div>
        )}

        <div className="relative mt-5 flex justify-between border-t border-white/15 pt-4 text-sm">
          <span className="font-medium">
            {user.firstName} {user.lastName}
          </span>
          <span className="font-mono tracking-wider text-white/80">{formatMemberNumber(user.id)}</span>
        </div>
      </section>

      {next && (
        <p className="flex items-center gap-2 rounded-xl border border-blue-100 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          <span>
            Renewed: <strong>{next.plan.name}</strong> starts on {formatDate(next.startDate)}.
          </span>
        </p>
      )}

      {hint && !next && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            status === 'EXPIRING_SOON' || status === 'EXPIRED'
              ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
              : isUpcoming
                ? 'border-blue-100 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300'
                : 'border-line bg-surface text-ink-3'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export default MyMembershipCard;
