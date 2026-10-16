import { Trophy } from 'lucide-react';
import Card from './ui/Card.jsx';

// Loyalty levels: members earn points by visiting the gym (added with QR check-in).
const LEVELS = [
  { name: 'Bronze', from: 0, style: 'bg-amber-100 text-amber-800' },
  { name: 'Silver', from: 100, style: 'bg-slate-200 text-slate-700' },
  { name: 'Gold', from: 300, style: 'bg-yellow-100 text-yellow-800' },
];

// The member's points, level and progress to the next level.
function PointsCard({ points = 0 }) {
  const levelIndex = LEVELS.findLastIndex((level) => points >= level.from);
  const level = LEVELS[levelIndex];
  const next = LEVELS[levelIndex + 1];
  const progress = next ? Math.round(((points - level.from) / (next.from - level.from)) * 100) : 100;

  return (
    <Card title="Points" description="Earn 10 points for every visit (once per day).">
      <div className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Trophy className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-3xl font-bold leading-tight text-slate-900">{points}</p>
          <p className="text-sm text-slate-500">points</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-sm font-semibold ${level.style}`}>{level.name}</span>
      </div>

      <div className="mt-5">
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress to the next level"
        >
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {next ? `${next.from - points} points to ${next.name}` : 'Top level reached!'}
        </p>
      </div>
    </Card>
  );
}

export default PointsCard;
