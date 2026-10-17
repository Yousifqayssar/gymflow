import { CircleCheck, CircleHelp, Clock, ScanLine, ShieldX } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatDate, formatMemberNumber } from '../../utils/format.js';
import { formatTime } from '../../utils/classDisplay.js';
import { LEVEL_DISPLAY } from '../../utils/levels.js';

// How each kind of result looks: a coloured header the staff can read from a distance.
const STYLES = {
  success: { icon: CircleCheck, header: 'from-brand-500 to-brand-700', label: 'Checked in' },
  already: { icon: Clock, header: 'from-sky-500 to-sky-700', label: 'Already checked in today' },
  refused: { icon: ShieldX, header: 'from-red-500 to-red-700', label: 'Entry refused' },
  error: { icon: CircleHelp, header: 'from-slate-500 to-slate-700', label: 'Not recognised' },
};

// The answer to the last scan. `result` is built by the check-in page:
//   { type: 'success' | 'already', data }  – data is the POST /api/check-ins answer
//   { type: 'refused' | 'error', message, hint? } – the message from the server
function CheckInResult({ result }) {
  // aria-live: screen readers announce each new result without the staff moving focus.
  return (
    <div aria-live="polite">
      {result ? <ResultCard result={result} /> : <WaitingCard />}
    </div>
  );
}

function WaitingCard() {
  return (
    <Card>
      <EmptyState icon={ScanLine} title="Waiting for a member" description="The result of each check-in appears here." />
    </Card>
  );
}

function ResultCard({ result }) {
  const { icon: Icon, header, label } = STYLES[result.type];
  const member = result.data?.member;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`flex items-center gap-3 bg-gradient-to-br px-5 py-4 text-white ${header}`}>
        <Icon className="size-7 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="truncate text-xl font-bold">
            {member ? `Welcome, ${member.firstName}!` : result.message}
          </p>
        </div>
      </div>

      {member ? <MemberDetails result={result} /> : <RefusedHint type={result.type} hint={result.hint} />}
    </section>
  );
}

// For a successful (or repeated) check-in: who it is, their membership and points.
function MemberDetails({ result }) {
  const { member, checkIn, points, level } = result.data;
  const { membership } = member;
  const isExpiringSoon = membership.status === 'EXPIRING_SOON';
  const LevelIcon = LEVEL_DISPLAY[level].icon;

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-3">
        <Avatar firstName={member.firstName} lastName={member.lastName} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {member.firstName} {member.lastName}
          </p>
          <p className="font-mono text-sm text-slate-500">{formatMemberNumber(member.id)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-slate-500">Membership</dt>
          <dd className="font-medium text-slate-900">{membership.planName}</dd>
          <dd className={isExpiringSoon ? 'font-medium text-amber-700' : 'text-slate-500'}>
            {membership.daysRemaining} {membership.daysRemaining === 1 ? 'day' : 'days'} left
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-slate-500">{result.type === 'success' ? 'Checked in at' : 'First check-in'}</dt>
          <dd className="font-medium text-slate-900">{formatTime(checkIn.checkedInAt)}</dd>
          <dd className="text-slate-500">{checkIn.method === 'QR' ? 'QR code' : 'Member number'}</dd>
        </div>
      </dl>

      {isExpiringSoon && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Membership ends on {formatDate(membership.endDate)} – remind the member to renew.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {result.type === 'success' ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">+10 points</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">No extra points today</span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${LEVEL_DISPLAY[level].chip}`}>
          <LevelIcon className="size-3.5" aria-hidden="true" />
          {level} · {points} points
        </span>
      </div>
    </div>
  );
}

// For refused or unknown codes: what the staff can do next.
function RefusedHint({ type, hint }) {
  const text =
    hint ??
    (type === 'refused'
      ? 'The member can renew at the front desk. After an admin assigns a new membership, scan again.'
      : 'Check that it is the member’s GymFlow QR code or a member number like GF-00004.');
  return <p className="p-5 text-sm text-slate-600">{text}</p>;
}

export default CheckInResult;
