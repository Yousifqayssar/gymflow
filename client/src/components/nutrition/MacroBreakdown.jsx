import { useState } from 'react';

// Where the meal's calories come from: protein, carbs and fat as one stacked bar.
// 1 g protein = 4 kcal, 1 g carbs = 4 kcal, 1 g fat = 9 kcal.
// Chart rules: colours checked for colour-blindness, 2px gaps between segments, a legend with
// the numbers (text never in the bar colours), a hover/focus readout, and values as text too.
const MACROS = [
  { key: 'proteinG', label: 'Protein', kcalPerGram: 4, bar: 'bg-[#059669]' },
  { key: 'carbsG', label: 'Carbs', kcalPerGram: 4, bar: 'bg-[#0284c7]' },
  { key: 'fatG', label: 'Fat', kcalPerGram: 9, bar: 'bg-[#d97706]' },
];

function MacroBreakdown({ totals }) {
  const [active, setActive] = useState(null);
  const parts = MACROS.map((macro) => ({ ...macro, grams: totals[macro.key], kcal: totals[macro.key] * macro.kcalPerGram }));
  const totalKcal = parts.reduce((sum, part) => sum + part.kcal, 0);
  const percent = (kcal) => (totalKcal > 0 ? Math.round((kcal / totalKcal) * 100) : 0);

  return (
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={parts.map((p) => `${p.label} ${percent(p.kcal)}%`).join(', ')}>
        {parts
          .filter((part) => part.kcal > 0)
          .map((part) => (
            <div
              key={part.key}
              className={`h-full transition-opacity first:rounded-l-full last:rounded-r-full ${part.bar} ${active && active !== part.key ? 'opacity-40' : ''}`}
              style={{ width: `${percent(part.kcal)}%` }}
              onPointerEnter={() => setActive(part.key)}
              onPointerLeave={() => setActive(null)}
            />
          ))}
      </div>

      {/* Legend with the numbers; hovering an entry highlights its part of the bar */}
      <ul className="mt-4 grid grid-cols-3 gap-3">
        {parts.map((part) => (
          <li
            key={part.key}
            onPointerEnter={() => setActive(part.key)}
            onPointerLeave={() => setActive(null)}
            className={`rounded-xl bg-surface-2 p-3 transition ${active === part.key ? 'ring-2 ring-line-strong' : ''}`}
          >
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <span className={`size-2.5 rounded-full ${part.bar}`} aria-hidden="true" />
              {part.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">
              {part.grams} <span className="text-base font-medium text-muted">g</span>
            </p>
            <p className="text-xs text-muted">{percent(part.kcal)}% of calories</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MacroBreakdown;
