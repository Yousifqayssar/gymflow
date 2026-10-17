import { History, QrCode, Keyboard } from 'lucide-react';
import Card from './ui/Card.jsx';
import EmptyState from './ui/EmptyState.jsx';
import { formatLongDay, formatTime } from '../utils/classDisplay.js';

// The member's latest gym visits as a small timeline. `visits` comes from GET /api/me/visits.
function RecentVisits({ visits }) {
  return (
    <Card title="Recent visits" description={visits ? `${visits.visits} visits in total` : undefined} padded={false}>
      {!visits && <div className="m-5 h-24 animate-pulse rounded-xl bg-slate-100" />}
      {visits?.recentVisits.length === 0 && (
        <EmptyState icon={History} title="No visits yet" description="Show your QR code at the entrance – every visit earns 10 points." />
      )}
      {visits?.recentVisits.length > 0 && (
        <ol className="relative px-5 py-4">
          {/* the vertical line of the timeline */}
          <span aria-hidden="true" className="absolute top-6 bottom-6 left-[2.15rem] w-px bg-slate-200" />
          {visits.recentVisits.map((visit) => {
            const Icon = visit.method === 'QR' ? QrCode : Keyboard;
            return (
              <li key={visit.id} className="relative flex items-center gap-4 py-2">
                <span className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-4 ring-white">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{formatLongDay(visit.checkedInAt)}</p>
                  <p className="text-xs text-slate-500">
                    {formatTime(visit.checkedInAt)} · {visit.method === 'QR' ? 'QR code' : 'Member number'}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">+10</span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export default RecentVisits;
