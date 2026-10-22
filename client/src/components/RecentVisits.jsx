import { History, QrCode, Keyboard } from 'lucide-react';
import Card from './ui/Card.jsx';
import EmptyState from './ui/EmptyState.jsx';
import { formatLongDay, formatTime } from '../utils/classDisplay.js';

// The member's latest gym visits as a small timeline. `visits` comes from GET /api/me/visits.
function RecentVisits({ visits }) {
  return (
    <Card title="Recent visits" description={visits ? `${visits.visits} visits in total` : undefined} padded={false}>
      {!visits && <div className="m-5 h-24 animate-pulse rounded-xl bg-surface-3" />}
      {visits?.recentVisits.length === 0 && (
        <EmptyState icon={History} title="No visits yet" description="Show your QR code at the entrance – every visit earns 10 points." />
      )}
      {visits?.recentVisits.length > 0 && (
        <ol className="relative px-5 py-4">
          {/* the vertical line of the timeline */}
          <span aria-hidden="true" className="absolute top-6 bottom-6 left-[2.15rem] w-px bg-surface-4" />
          {visits.recentVisits.map((visit) => {
            const Icon = visit.method === 'QR' ? QrCode : Keyboard;
            return (
              <li key={visit.id} className="relative flex items-center gap-4 py-2">
                <span className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-4 ring-surface">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{formatLongDay(visit.checkedInAt)}</p>
                  <p className="text-xs text-muted">
                    {formatTime(visit.checkedInAt)} · {visit.location ? visit.location.name : 'Our gym'}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">+10</span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export default RecentVisits;
