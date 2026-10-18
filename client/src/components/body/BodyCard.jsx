import { useState } from 'react';
import { CalendarClock, Info, PencilLine, Ruler, Scale, Target } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import BodyForm from './BodyForm.jsx';
import WeightChart from './WeightChart.jsx';
import { bmiRange, formatKg, GOALS } from '../../utils/body.js';
import { formatDate } from '../../utils/format.js';

function Stat({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <div className="mt-1 font-display text-2xl font-bold text-ink">{children}</div>
    </div>
  );
}

// A member's body information: height, weight, BMI, goal and the weight chart.
//   overview: { latest, history, isDue, nextDueOn } from the API
//   canEdit:  the member themself (shows "Update" and the monthly form)
//   onSaved:  receives the new overview after an update
function BodyCard({ overview, canEdit = false, onSaved, title = 'My body' }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!overview) return <div className="h-64 animate-pulse rounded-2xl bg-surface-3" />;

  const { latest, history, isDue, nextDueOn } = overview;
  const goal = latest ? GOALS[latest.goal] : null;
  const range = latest ? bmiRange(latest.bmi) : null;
  const toTarget = latest?.targetWeightKg ? Math.round((latest.weightKg - latest.targetWeightKg) * 10) / 10 : null;

  return (
    <Card
      title={title}
      description={latest ? `Last updated ${formatDate(latest.recordedOn)}` : undefined}
      actions={
        canEdit && (
          <Button size="sm" variant={isDue ? 'primary' : 'secondary'} icon={PencilLine} onClick={() => setIsFormOpen(true)}>
            {latest ? 'Update' : 'Add my details'}
          </Button>
        )
      }
    >
      {canEdit && <BodyForm key={latest?.id ?? 'new'} isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} latest={latest} onSaved={onSaved} />}

      {!latest && (
        <EmptyState
          icon={Scale}
          title="No body details yet"
          description={canEdit ? 'Add your height, weight and goal – your trainer uses them to plan your workouts.' : 'This member has not added their details yet.'}
        />
      )}

      {latest && (
        // @container: the tiles follow the card's own width (it is narrow inside a popup, wide on a page)
        <div className="@container space-y-5">
          {canEdit && isDue && (
            <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              Your monthly check-in is due – please update your weight.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
            <Stat icon={Ruler} label="Height">
              {latest.heightCm} <span className="text-base font-medium text-muted">cm</span>
            </Stat>
            <Stat icon={Scale} label="Weight">
              {latest.weightKg} <span className="text-base font-medium text-muted">kg</span>
            </Stat>
            <Stat icon={Info} label="BMI">
              {latest.bmi}
              <span className={`mt-1 block w-fit rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold ${range.tone}`}>{range.label}</span>
            </Stat>
            <Stat icon={goal.icon} label="Goal">
              <span className="text-lg">{goal.label}</span>
            </Stat>
          </div>

          {latest.targetWeightKg && (
            <p className="flex items-center gap-2 text-sm text-ink-3">
              <Target className="size-4 text-amber-500" aria-hidden="true" />
              Target weight {formatKg(latest.targetWeightKg)}
              {toTarget !== 0 && <span className="text-muted">· {formatKg(Math.abs(toTarget))} to go</span>}
              {toTarget === 0 && <span className="font-semibold text-brand-700 dark:text-brand-300">· reached!</span>}
            </p>
          )}

          {history.length > 1 ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink">Weight over time</h3>
              <WeightChart history={history} targetWeightKg={latest.targetWeightKg} />
            </div>
          ) : (
            <p className="text-sm text-muted">The weight chart appears after the second monthly check-in.</p>
          )}

          <p className="text-xs text-faint">
            BMI is a rough guide only – it does not know about muscle. {!isDue && `Next check-in: ${formatDate(nextDueOn)}.`}
          </p>
        </div>
      )}
    </Card>
  );
}

export default BodyCard;
