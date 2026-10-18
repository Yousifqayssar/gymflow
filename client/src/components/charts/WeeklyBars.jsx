import { useState } from 'react';
import { m } from 'motion/react';

// Workouts per week as columns (one series, so no legend: the card title names it).
// Chart rules: columns at most 24 px wide with rounded tops, a light baseline, values on hover/focus,
// the current week highlighted by its label, and a table for screen readers.
//   weeks: [{ weekStart: "2026-10-12", workouts: 2, volumeKg: 1450 }] oldest first
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "2026-09-28" → "28 Sep" (short enough to fit under a column)
const shortDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

function WeeklyBars({ weeks }) {
  const [active, setActive] = useState(null);
  const max = Math.max(3, ...weeks.map((w) => w.workouts));

  return (
    <figure>
      <div className="relative flex h-44 items-end gap-2 @4xl:h-72 border-b border-line pt-6" role="img" aria-label="Workouts per week, last 8 weeks">
        {weeks.map((week, index) => {
          const isLast = index === weeks.length - 1;
          const height = (week.workouts / max) * 100;
          return (
            <div
              key={week.weekStart}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
            >
              {/* The value above the bar on hover, and always for the current week */}
              {(active === index || (active === null && isLast)) && (
                <span
                  className={`absolute z-10 rounded-md bg-ink px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-surface ${isLast ? 'right-0' : ''}`}
                  style={{ bottom: `calc(${Math.max(height, 2)}% + 6px)` }}
                >
                  {week.workouts} {week.workouts === 1 ? 'workout' : 'workouts'}
                </span>
              )}
              <m.div
                className={`w-full max-w-6 rounded-t ${week.workouts ? 'bg-[#059669]' : 'bg-surface-4'} ${active !== null && active !== index ? 'opacity-50' : ''}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 2)}%` }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {weeks.map((week, index) => (
          <span
            key={week.weekStart}
            className={`flex-1 text-center text-[11px] whitespace-nowrap ${index === weeks.length - 1 ? 'font-semibold text-ink' : 'text-faint'}`}
          >
            {index === weeks.length - 1 ? 'Now' : shortDate(week.weekStart)}
          </span>
        ))}
      </div>
      {/* Wrapped: a table ignores the 1px width of sr-only and would widen the page */}
      <div className="sr-only">
        <table>
          <caption>Workouts per week</caption>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.weekStart}>
                <th scope="row">Week of {week.weekStart}</th>
                <td>{week.workouts} workouts</td>
                <td>{week.volumeKg} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export default WeeklyBars;
