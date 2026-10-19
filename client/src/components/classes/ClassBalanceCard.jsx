import { Link } from 'react-router';
import { Crown, Dumbbell, Ticket } from 'lucide-react';
import { getMyClassBalance } from '../../api/me.js';
import { useApiData } from '../../hooks/useApiData.js';
import Button from '../ui/Button.jsx';
import { AnimatedNumber } from '../ui/motion.jsx';
import { formatDate } from '../../utils/format.js';

// The member's class balance for this membership month (Premium), or a note that Basic is gym only.
// Shows nothing without a membership today (the membership card already explains that).
//   showUpgrade: Basic members get a button to the Premium plans (not on the Membership page itself).
function ClassBalanceCard({ showUpgrade = true, className = '' }) {
  const { data } = useApiData(getMyClassBalance);
  const balance = data?.balance;
  if (!balance) return null;

  if (balance.type === 'BASIC') {
    return (
      <section className={`flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${className}`}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-ink-3">
          <Dumbbell className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-semibold text-ink">Your Basic plan is gym only</p>
          <p className="text-sm text-muted">Group classes are included in Premium plans – 10 classes every month.</p>
        </div>
        {showUpgrade && (
          <Button as={Link} to="/membership" icon={Crown} variant="secondary" className="w-full sm:w-auto">
            See Premium plans
          </Button>
        )}
      </section>
    );
  }

  const isEmpty = balance.left === 0;
  return (
    <section
      className={`flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border p-4 shadow-sm sm:p-5 ${
        isEmpty ? 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10' : 'border-line bg-surface'
      } ${className}`}
      aria-label="Your classes this month"
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
          isEmpty ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-md'
        }`}
      >
        <Ticket className="size-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-ink">
          <span className="font-display text-3xl font-bold tabular-nums">
            <AnimatedNumber value={balance.left} />
          </span>{' '}
          <span className="font-medium">
            of {balance.classesPerMonth} classes left
          </span>{' '}
          <span className="text-sm text-muted">this month</span>
        </p>
        <p className="text-sm text-muted">
          {balance.resetsOn ? `New classes on ${formatDate(balance.resetsOn)}` : `Until your membership ends on ${formatDate(balance.monthEnd)}`}
          {' · '}unused classes don’t carry over
        </p>
      </div>

      {/* One dot per class: green = still free, grey = booked or used (own row, lined up with the text) */}
      <div className="flex w-full flex-wrap gap-1.5 pl-16" aria-hidden="true">
        {Array.from({ length: balance.classesPerMonth }, (_, i) => (
          <span key={i} className={`size-3 rounded-full ${i < balance.left ? 'bg-brand-500' : 'bg-surface-4'}`} />
        ))}
      </div>
    </section>
  );
}

export default ClassBalanceCard;
