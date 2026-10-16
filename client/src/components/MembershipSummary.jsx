import { formatDate } from '../utils/format.js';

// One short line about a member's current membership, e.g. "Monthly · ends 19 Oct 2026 · 5 days left".
function MembershipSummary({ membership }) {
  switch (membership.status) {
    case 'ACTIVE':
    case 'EXPIRING_SOON':
      return (
        <>
          {membership.planName} · ends {formatDate(membership.endDate)} ·{' '}
          <span className={membership.status === 'EXPIRING_SOON' ? 'font-semibold text-amber-700' : ''}>
            {membership.daysRemaining} {membership.daysRemaining === 1 ? 'day' : 'days'} left
          </span>
        </>
      );
    case 'UPCOMING':
      return (
        <>
          {membership.planName} · starts {formatDate(membership.startDate)}
        </>
      );
    case 'EXPIRED':
      return (
        <>
          {membership.planName} · ended {formatDate(membership.endDate)}
        </>
      );
    default:
      return 'No membership yet';
  }
}

export default MembershipSummary;
