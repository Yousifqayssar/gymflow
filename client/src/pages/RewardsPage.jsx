import { Link } from 'react-router';
import { BadgePercent, CalendarCheck, QrCode, Sparkles } from 'lucide-react';
import { getMyVisits } from '../api/me.js';
import { useApiData } from '../hooks/useApiData.js';
import LevelCard from '../components/LevelCard.jsx';
import RewardsLadder from '../components/RewardsLadder.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { LEVELS } from '../utils/levels.js';

const HOW_TO_EARN = [
  { icon: QrCode, title: 'Check in with your QR code', text: 'Show "My QR" at the entrance. Every visit gives 10 points.' },
  { icon: CalendarCheck, title: 'Once per day', text: 'The first check-in of the day counts – come back tomorrow for more.' },
  { icon: BadgePercent, title: 'Save automatically', text: 'Your discount is applied when the front desk sells you your next membership.' },
];

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

      <section>
        <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">All levels</h2>
        {visits ? <RewardsLadder points={visits.points} level={visits.level} /> : <div className="h-56 animate-pulse rounded-2xl bg-surface-3" />}
      </section>

      <section>
        <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">How to earn points</h2>
        <div className="grid gap-4 md:grid-cols-3">
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
