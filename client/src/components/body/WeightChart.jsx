import { useState } from 'react';
import { formatDate } from '../../utils/format.js';
import { formatKg } from '../../utils/body.js';

// Weight over time as a small line chart (one series, so no legend: the card title names it).
// Follows our chart rules: 2px line, 8px points with a ring in the card colour, light hairline grid,
// text in text colours (never the line colour), a hover/focus readout, and a hidden table for screen readers.
// `history`: [{ recordedOn, weightKg }] oldest first. `targetWeightKg` (optional) is drawn as a reference line.
const WIDTH = 560;
const HEIGHT = 180;
const PAD = { top: 16, right: 56, bottom: 28, left: 40 };

function WeightChart({ history, targetWeightKg }) {
  const [active, setActive] = useState(null); // index of the point under the pointer

  const weights = history.map((h) => h.weightKg);
  const allValues = targetWeightKg ? [...weights, targetWeightKg] : weights;
  // Some air above and below, rounded to whole kilos, so small changes are visible but not exaggerated.
  const min = Math.floor(Math.min(...allValues) - 1);
  const max = Math.ceil(Math.max(...allValues) + 1);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (history.length === 1 ? plotW / 2 : (i / (history.length - 1)) * plotW);
  const y = (kg) => PAD.top + (1 - (kg - min) / (max - min)) * plotH;
  const gridValues = [min, (min + max) / 2, max];
  const points = history.map((h, i) => ({ ...h, cx: x(i), cy: y(h.weightKg) }));
  const last = points.at(-1);

  // The pointer snaps to the nearest check-in (the crosshair finds the X).
  function handlePointerMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * WIDTH;
    let nearest = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.cx - px) < Math.abs(points[nearest].cx - px)) nearest = i;
    });
    setActive(nearest);
  }

  const shown = active === null ? null : points[active];

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full touch-none overflow-visible"
        role="img"
        aria-label={`Weight from ${formatKg(weights[0])} to ${formatKg(last.weightKg)}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActive(null)}
      >
        {/* Recessive hairline grid with kilo labels */}
        {gridValues.map((kg) => (
          <g key={kg}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(kg)} y2={y(kg)} className="stroke-line" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(kg)} dy="0.32em" textAnchor="end" className="fill-faint text-[11px]">
              {Math.round(kg)}
            </text>
          </g>
        ))}

        {/* Goal line (if the member set a target weight) */}
        {targetWeightKg && (
          <g>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(targetWeightKg)} y2={y(targetWeightKg)} className="stroke-amber-500" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x={WIDTH - PAD.right + 6} y={y(targetWeightKg)} dy="0.32em" className="fill-muted text-[11px] font-medium">
              Goal
            </text>
          </g>
        )}

        {/* Crosshair */}
        {shown && <line x1={shown.cx} x2={shown.cx} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-line-strong" strokeWidth="1" />}

        {/* The weight line */}
        {points.length > 1 && (
          <polyline
            points={points.map((p) => `${p.cx},${p.cy}`).join(' ')}
            fill="none"
            className="stroke-brand-600"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {points.map((p, i) => (
          <circle key={p.recordedOn} cx={p.cx} cy={p.cy} r={i === active ? 5 : 4} className="fill-brand-600 stroke-surface" strokeWidth="2" />
        ))}

        {/* The latest value at the end of the line */}
        <text x={last.cx + 10} y={last.cy} dy="0.32em" className="fill-ink text-[12px] font-semibold">
          {formatKg(last.weightKg)}
        </text>

        {/* First and last date under the chart */}
        <text x={points[0].cx} y={HEIGHT - 6} textAnchor={points.length > 1 ? 'start' : 'middle'} className="fill-faint text-[11px]">
          {formatDate(points[0].recordedOn)}
        </text>
        {points.length > 1 && (
          <text x={last.cx} y={HEIGHT - 6} textAnchor="end" className="fill-faint text-[11px]">
            {formatDate(last.recordedOn)}
          </text>
        )}
      </svg>

      {/* Hover readout: value first, then the date */}
      {shown && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs shadow-lg"
          style={{ left: `${(shown.cx / WIDTH) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <strong className="block text-sm text-ink">{formatKg(shown.weightKg)}</strong>
          <span className="text-muted">{formatDate(shown.recordedOn)}</span>
        </div>
      )}

      {/* The same numbers as a table, for screen readers */}
      <table className="sr-only">
        <caption>Weight check-ins</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Weight</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.recordedOn}>
              <td>{formatDate(h.recordedOn)}</td>
              <td>{formatKg(h.weightKg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default WeightChart;
