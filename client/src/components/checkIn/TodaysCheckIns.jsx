import { Keyboard, QrCode, Users } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import { formatTime } from '../../utils/classDisplay.js';

// Everyone who came in today, newest first. `today` comes from GET /api/check-ins/today.
// `limit` shows only the first few (used on the admin home page).
function TodaysCheckIns({ today, error, limit, actions }) {
  const checkIns = limit ? today?.checkIns.slice(0, limit) : today?.checkIns;

  return (
    <Card
      title="Today’s check-ins"
      description={today ? `${today.count} ${today.count === 1 ? 'visit' : 'visits'} today` : undefined}
      actions={actions}
      padded={false}
    >
      {error && (
        <div className="p-5">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}
      {!today && !error && <div className="m-5 h-24 animate-pulse rounded-xl bg-slate-100" />}
      {today?.count === 0 && <EmptyState icon={Users} title="No visits yet today" description="Checked-in members appear here." />}

      <ul className="divide-y divide-slate-100">
        {checkIns?.map((checkIn) => {
          const MethodIcon = checkIn.method === 'QR' ? QrCode : Keyboard;
          return (
            <li key={checkIn.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar firstName={checkIn.member.firstName} lastName={checkIn.member.lastName} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                {checkIn.member.firstName} {checkIn.member.lastName}
              </p>
              <span
                className="flex items-center gap-1.5 text-sm text-slate-500"
                title={checkIn.method === 'QR' ? 'QR code' : 'Member number'}
              >
                <MethodIcon className="size-3.5" aria-hidden="true" />
                {formatTime(checkIn.checkedInAt)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default TodaysCheckIns;
