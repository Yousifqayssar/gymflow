import { Check, Sparkles } from 'lucide-react';
import { formatMonths, formatPrice } from '../../utils/format.js';
import PlanTypeBadge from '../PlanTypeBadge.jsx';
import { planType } from '../../utils/planType.js';

// Choose a plan to buy. Native radio buttons (styled as cards), so the keyboard and screen readers work.
//   discountPercent: the member's loyalty discount, to show the price they will really pay
function PlanPicker({ plans, selectedId, onSelect, discountPercent = 0 }) {
  const longest = Math.max(...plans.map((p) => p.durationMonths));

  return (
    <fieldset className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <legend className="sr-only">Choose a plan</legend>
      {plans.map((plan) => {
        const isSelected = plan.id === selectedId;
        const price = Number(plan.price);
        const yourPrice = Math.round(price * (100 - discountPercent)) / 100;
        const isBestValue = plan.durationMonths === longest && plans.length > 1;
        return (
          <label
            key={plan.id}
            className={`relative flex cursor-pointer flex-col rounded-2xl border-2 bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-200 dark:has-[:focus-visible]:ring-brand-500/30 ${
              isSelected ? 'border-brand-600 dark:border-brand-400' : 'border-line'
            }`}
          >
            <input type="radio" name="plan" value={plan.id} checked={isSelected} onChange={() => onSelect(plan.id)} className="sr-only" />
            {isBestValue && (
              <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                <Sparkles className="size-3" aria-hidden="true" />
                Best value
              </span>
            )}
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-semibold text-ink">{plan.name}</span>
                <span className="text-sm text-muted">{formatMonths(plan.durationMonths)}</span>
              </span>
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  isSelected ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-slate-900' : 'border-line-strong'
                }`}
                aria-hidden="true"
              >
                {isSelected && <Check className="size-4" strokeWidth={3} />}
              </span>
            </span>
            <span className="mt-3 flex flex-col items-start gap-1">
              {/* Short badge + the detail on its own line: the cards are narrow on some screens */}
              <PlanTypeBadge classesPerMonth={plan.classesPerMonth} withDetail={false} />
              <span className="text-sm text-ink-3">{planType(plan.classesPerMonth).detail}</span>
            </span>
            <span className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-4xl font-bold text-ink">{formatPrice(yourPrice)}</span>
              {discountPercent > 0 && <span className="text-sm text-faint line-through">{formatPrice(price)}</span>}
            </span>
            <span className="text-xs text-muted">{formatPrice(yourPrice / plan.durationMonths)} per month</span>
            {plan.description && <span className="mt-3 text-sm text-ink-3">{plan.description}</span>}
          </label>
        );
      })}
    </fieldset>
  );
}

export default PlanPicker;
