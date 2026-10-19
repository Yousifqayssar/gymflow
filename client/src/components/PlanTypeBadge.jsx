import { Crown, Dumbbell } from 'lucide-react';
import { planType } from '../utils/planType.js';

// "Premium · 10 classes a month" or "Basic · Gym only", as a small label.
//   withDetail={false} shows only "Premium" / "Basic".
function PlanTypeBadge({ classesPerMonth, withDetail = true }) {
  const { type, label, detail } = planType(classesPerMonth);
  const isPremium = type === 'PREMIUM';
  const Icon = isPremium ? Crown : Dumbbell;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isPremium ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-surface-3 text-ink-3'
      }`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
      {withDetail && <span className="font-medium opacity-80">· {detail}</span>}
    </span>
  );
}

export default PlanTypeBadge;
