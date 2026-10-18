import { CircleCheck, CircleHelp, Clock, ScanLine, ShieldX } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import Avatar from '../ui/Avatar.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatDate, formatMemberNumber } from '../../utils/format.js';
import { formatTime } from '../../utils/classDisplay.js';
import { LEVEL_DISPLAY } from '../../utils/levels.js';

// How each kind of result looks: a coloured header the staff can read from a distance.
const STYLES = {
  success: { icon: CircleCheck, header: 'from-brand-600 to-brand-800', label: 'Checked in' },
  already: { icon: Clock, header: 'from-sky-500 to-sky-700', label: 'Already checked in today' },
  refused: { icon: ShieldX, header: 'from-red-500 to-red-700', label: 'Entry refused' },
  error: { icon: CircleHelp, header: 'from-slate-500 to-slate-700', label: 'Not recognised' },
};

// The answer to the last scan. `result` is built by the check-in page:
// Every result has an `id`, so scanning the same member twice still plays the animation again.
//   { type: 'success' | 'already', data }  – data is the POST /api/check-ins answer
//   { type: 'refused' | 'error', message, hint? } – the message from the server
function CheckInResult({ result }) {
  // aria-live: screen readers announce each new result without the staff moving focus.
  return (
    <div aria-live="polite">
      {/* mode="wait": the old result leaves first, then the new one pops in */}
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={result?.id ?? 'waiting'}
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 26 } }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
        >
          {result ? <ResultCard result={result} /> : <WaitingCard />}
        </m.div>
      </AnimatePresence>
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
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className={`flex items-center gap-3 bg-gradient-to-br px-5 py-4 text-white ${header}`}>
        {/* The icon "bounces" in a moment after the card */}
        <m.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
        >
          <Icon className="size-7 shrink-0" aria-hidden="true" />
        </m.span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-xl leading-snug font-bold text-balance">
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
        <Avatar firstName={member.firstName} lastName={member.lastName} avatar={member.avatar} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {member.firstName} {member.lastName}
          </p>
          <p className="font-mono text-sm text-muted">{formatMemberNumber(member.id)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-muted">Membership</dt>
          <dd className="font-medium text-ink">{membership.planName}</dd>
          <dd className={isExpiringSoon ? 'font-medium text-amber-700 dark:text-amber-300' : 'text-muted'}>
            {membership.daysRemaining} {membership.daysRemaining === 1 ? 'day' : 'days'} left
          </dd>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-muted">{result.type === 'success' ? 'Checked in at' : 'First check-in'}</dt>
          <dd className="font-medium text-ink">{formatTime(checkIn.checkedInAt)}</dd>
          <dd className="text-muted">{checkIn.method === 'QR' ? 'QR code' : 'Member number'}</dd>
        </div>
      </dl>

      {isExpiringSoon && (
        <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          Membership ends on {formatDate(membership.endDate)} – remind the member to renew.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {result.type === 'success' ? (
          <m.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          >
            +10 points
          </m.span>
        ) : (
          <span className="rounded-full bg-surface-3 px-2.5 py-1 font-medium text-ink-3">No extra points today</span>
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
  return <p className="p-5 text-sm text-ink-3">{text}</p>;
}

export default CheckInResult;
