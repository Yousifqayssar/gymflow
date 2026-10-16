import Badge from './Badge.jsx';

// How each membership status (calculated by the API) is shown.
const STATUS_DISPLAY = {
  ACTIVE: { tone: 'green', label: 'Active' },
  EXPIRING_SOON: { tone: 'amber', label: 'Expiring soon' },
  EXPIRED: { tone: 'red', label: 'Expired' },
  UPCOMING: { tone: 'blue', label: 'Upcoming' },
  NONE: { tone: 'gray', label: 'No membership' },
};

function MembershipStatusBadge({ status }) {
  const { tone, label } = STATUS_DISPLAY[status] ?? STATUS_DISPLAY.NONE;
  return <Badge tone={tone}>{label}</Badge>;
}

export default MembershipStatusBadge;
