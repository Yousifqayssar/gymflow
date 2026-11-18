import { useState } from 'react';
import { m } from 'motion/react';
import { formatPrice } from '../../utils/format.js';

// Paid revenue per month as columns (one series, so no legend: the card title names it).
// Chart rules match the other charts: columns at most 28 px wide with rounded tops, a baseline, the
// value on hover/focus, the current month highlighted by its label, and a table for screen readers.
//   months: [{ month: "2026-10", label: "Oct", revenue: "1500.00" }] oldest first, 6 entries
function MonthlyRevenueBars({ months }) {
  const [active, setActive] = useState(null);
  const values = months.map((item) => Number(item.revenue));
  const max = Math.max(1, ...values);

  return (
    <figure>
      <div className="relative flex h-44 items-end gap-2 border-b border-line pt-7 @4xl:h-64" role="img" aria-label="Paid revenue per month, last 6 months">
        {months.map((item, index) => {
          const value = values[index];
          const isLast = index === months.length - 1;
          const height = (value / max) * 100;
          return (
            <div
              key={item.month}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
            >
              {(active === index || (active === null && isLast)) && (
                <span
                  className={`absolute z-10 rounded-md bg-ink px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-surface ${isLast ? 'right-0' : ''}`}
                  style={{ bottom: `calc(${Math.max(height, 2)}% + 6px)` }}
                >
                  {formatPrice(value)}
                </span>
              )}
              <m.div
                className={`w-full max-w-7 rounded-t ${value ? 'bg-[#059669]' : 'bg-surface-4'} ${active !== null && active !== index ? 'opacity-50' : ''}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 2)}%` }}
                transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {months.map((item, index) => (
          <span
            key={item.month}
            className={`flex-1 text-center text-[11px] whitespace-nowrap ${index === months.length - 1 ? 'font-semibold text-ink' : 'text-faint'}`}
          >
            {item.label}
          </span>
        ))}
      </div>
      <div className="sr-only">
        <table>
          <caption>Paid revenue per month</caption>
          <tbody>
            {months.map((item) => (
              <tr key={item.month}>
                <th scope="row">{item.month}</th>
                <td>{formatPrice(item.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export default MonthlyRevenueBars;
