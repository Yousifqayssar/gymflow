import { Keyboard, QrCode, Users } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
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
      {!today && !error && <div className="m-5 h-24 animate-pulse rounded-xl bg-surface-3" />}
      {today?.count === 0 && <EmptyState icon={Users} title="No visits yet today" description="Checked-in members appear here." />}

      <ul className="divide-y divide-line-soft">
        {/* initial={false}: no animation for the first load, only for visits added later */}
        <AnimatePresence initial={false}>
        {checkIns?.map((checkIn) => {
          const MethodIcon = checkIn.method === 'QR' ? QrCode : Keyboard;
          return (
            <m.li
              key={checkIn.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-5 py-3"
            >
              <Avatar firstName={checkIn.member.firstName} lastName={checkIn.member.lastName} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {checkIn.member.firstName} {checkIn.member.lastName}
              </p>
              <span
                className="flex items-center gap-1.5 text-sm text-muted"
                title={checkIn.method === 'QR' ? 'QR code' : 'Member number'}
              >
                <MethodIcon className="size-3.5" aria-hidden="true" />
                {formatTime(checkIn.checkedInAt)}
              </span>
            </m.li>
          );
        })}
        </AnimatePresence>
      </ul>
    </Card>
  );
}

export default TodaysCheckIns;
