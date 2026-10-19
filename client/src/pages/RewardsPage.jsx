import { Link } from 'react-router';
import { BadgePercent, CalendarCheck, CalendarX, Dumbbell, QrCode, Sparkles } from 'lucide-react';
import { getMyVisits } from '../api/me.js';
import { useApiData } from '../hooks/useApiData.js';
import LevelCard from '../components/LevelCard.jsx';
import RewardsLadder from '../components/RewardsLadder.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { LEVELS } from '../utils/levels.js';
import { formatLongDay, formatTime } from '../utils/classDisplay.js';

const HOW_TO_EARN = [
  { icon: QrCode, title: 'Check in with your QR code', text: 'Show "My QR" at the entrance. Every visit gives 10 points.' },
  { icon: CalendarCheck, title: 'Once per day', text: 'The first check-in of the day counts – come back tomorrow for more.' },
  { icon: Dumbbell, title: 'Show up to booked classes', text: 'Scan the trainer’s QR at the class. Booked but not there costs 10 points.' },
  { icon: BadgePercent, title: 'Save automatically', text: 'Your discount is applied automatically when you renew online or at the front desk.' },
];

const POINTS_PER_VISIT = 10;
const POINTS_PER_NO_SHOW = 10;

// How the points add up: visits earn, missed classes cost – and which classes were missed.
function PointsBreakdown({ visits }) {
  const missed = visits.missedClasses ?? [];
  const rows = [
    { label: `${visits.visits} ${visits.visits === 1 ? 'visit' : 'visits'} × ${POINTS_PER_VISIT}`, value: `+${visits.visits * POINTS_PER_VISIT}`, tone: 'text-brand-700 dark:text-brand-300' },
    { label: `${visits.noShows} missed ${visits.noShows === 1 ? 'class' : 'classes'} × ${POINTS_PER_NO_SHOW}`, value: `−${visits.noShows * POINTS_PER_NO_SHOW}`, tone: visits.noShows ? 'text-red-700 dark:text-red-300' : 'text-muted' },
  ];
  return (
    <Card title="How your points add up" description="Points never go below 0.">
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-ink-3">{row.label}</dt>
            <dd className={`font-mono font-semibold tabular-nums ${row.tone}`}>{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-line-soft pt-2">
          <dt className="font-semibold text-ink">Your points</dt>
          <dd className="font-mono font-bold tabular-nums text-ink">{visits.points}</dd>
        </div>
      </dl>

      <h3 className="mt-6 mb-2 text-xs font-medium uppercase tracking-wide text-faint">Missed classes</h3>
      {missed.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <CalendarCheck className="size-4 text-brand-600" aria-hidden="true" />
          None – you showed up to every class you booked. Keep it up!
        </p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {missed.map((item) => (
            <li key={item.classId} className="flex items-center gap-3 py-2.5">
              <CalendarX className="size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <Link to={`/classes/${item.classId}`} className="block truncate text-sm font-medium text-ink hover:underline">
                  {item.title}
                </Link>
                <p className="text-xs text-muted">
                  {formatLongDay(item.startsAt)} · {formatTime(item.startsAt)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-red-700 dark:text-red-300">−{POINTS_PER_NO_SHOW}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// Members: their loyalty level, what it gives them now, how to earn points, and all levels.
function RewardsPage() {
  const { data: visits } = useApiData(getMyVisits);
  const current = visits ? LEVELS.find((level) => level.name === visits.level) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rewards"
        description="The more you train, the more you save. Every visit brings you closer to the next level."
        actions={
          <Button as={Link} to="/my-qr" icon={QrCode}>
            Check in now
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <LevelCard visits={visits} />
        </div>
        <Card className="lg:col-span-3" title="Your rewards right now" description={current ? `As a ${current.name} member you get:` : undefined}>
          {!current && <div className="h-24 animate-pulse rounded-xl bg-surface-3" />}
          {current && (
            <div className="space-y-4">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold tracking-tight text-brand-700 dark:text-brand-300">{current.discountPercent}%</span>
                <span className="text-ink-3">off your next membership</span>
              </p>
              <ul className="space-y-2.5">
                {current.perks.map((perk) => (
                  <li key={perk.text} className="flex items-center gap-2.5 text-sm text-ink-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <perk.icon className="size-4" aria-hidden="true" />
                    </span>
                    {perk.text}
                  </li>
                ))}
              </ul>
              <p className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-3">
                <Sparkles className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
                Discounts are applied automatically. For guest passes and personal training, just ask at the front desk.
              </p>
            </div>
          )}
        </Card>
      </div>

      {visits ? <PointsBreakdown visits={visits} /> : <div className="h-48 animate-pulse rounded-2xl bg-surface-3" />}

      <section>
        <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">All levels</h2>
        {visits ? <RewardsLadder points={visits.points} level={visits.level} /> : <div className="h-56 animate-pulse rounded-2xl bg-surface-3" />}
      </section>

      <section>
        <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">How to earn points</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {HOW_TO_EARN.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-md">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default RewardsPage;
