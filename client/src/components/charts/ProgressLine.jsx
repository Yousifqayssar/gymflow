import { useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { formatDate } from '../../utils/format.js';

// One exercise over time: estimated maximum and heaviest weight per workout (two series, same unit, one axis),
// or reps for bodyweight exercises (one series). Colours checked for colour-blindness (#059669, #0284c7).
// Chart rules: 2px lines, points with a ring in the card colour, hairline grid, legend for two series,
// crosshair + readout on hover, values at the line ends, a table for screen readers.
// The drawing uses the real card width, so text stays the same size on a phone and on a laptop.
const DEFAULT_WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 18, right: 70, bottom: 28, left: 40 };
const SERIES_COLORS = ['#059669', '#0284c7'];

function ProgressLine({ exercise }) {
  const [active, setActive] = useState(null);
  const [WIDTH, setWidth] = useState(DEFAULT_WIDTH);
  const boxRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  const sessions = exercise.sessions;
  const series = exercise.isBodyweight
    ? [
        {
          key: 'reps',
          label: 'Best reps',
          unit: 'reps',
          values: sessions.map((s) => s.reps),
        },
      ]
    : [
        {
          key: 'max',
          label: 'Estimated max',
          unit: 'kg',
          values: sessions.map((s) => s.estimatedMaxKg),
        },
        {
          key: 'weight',
          label: 'Heaviest weight',
          unit: 'kg',
          values: sessions.map((s) => s.weightKg),
        },
      ];

  const all = series.flatMap((s) => s.values);
  const min = Math.floor(Math.min(...all) * 0.95);
  const max = Math.ceil(Math.max(...all) * 1.05) || 1;
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (sessions.length === 1 ? plotW / 2 : (i / (sessions.length - 1)) * plotW);
  const y = (v) => PAD.top + (1 - (v - min) / Math.max(max - min, 1)) * plotH;
  const grid = [min, (min + max) / 2, max];

  function handlePointerMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * WIDTH;
    let nearest = 0;
    sessions.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i;
    });
    setActive(nearest);
  }

  return (
    <figure>
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-4 text-xs text-muted">
          {series.map((s, i) => (
            <li key={s.key} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ backgroundColor: SERIES_COLORS[i] }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div ref={boxRef} className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full touch-none overflow-visible"
          role="img"
          aria-label={`${exercise.name}: progress over ${sessions.length} workouts`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {grid.map((value) => (
            <g key={value}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(value)} y2={y(value)} className="stroke-line" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(value)} dy="0.32em" textAnchor="end" className="fill-faint text-[11px]">
                {Math.round(value)}
              </text>
            </g>
          ))}
          {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-line-strong" strokeWidth="1" />}
          {series.map((s, si) => (
            <g key={s.key}>
              {sessions.length > 1 && (
                <m.polyline
                  points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                  fill="none"
                  stroke={SERIES_COLORS[si]}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              )}
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={active === i ? 5 : 3.5} fill={SERIES_COLORS[si]} className="stroke-surface" strokeWidth="2" />
              ))}
              <text x={x(sessions.length - 1) + 10} y={y(s.values.at(-1))} dy="0.32em" className="fill-ink text-[12px] font-semibold">
                {s.values.at(-1)} {s.unit}
              </text>
            </g>
          ))}
          <text x={x(0)} y={HEIGHT - 6} textAnchor={sessions.length > 1 ? 'start' : 'middle'} className="fill-faint text-[11px]">
            {formatDate(sessions[0].date)}
          </text>
          {sessions.length > 1 && (
            <text x={x(sessions.length - 1)} y={HEIGHT - 6} textAnchor="end" className="fill-faint text-[11px]">
              {formatDate(sessions.at(-1).date)}
            </text>
          )}
        </svg>
        {active !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(x(active) / WIDTH) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {series.map((s, si) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: SERIES_COLORS[si] }} aria-hidden="true" />
                <strong className="text-sm text-ink">
                  {s.values[active]} {s.unit}
                </strong>
                <span className="text-muted">{s.label}</span>
              </p>
            ))}
            <p className="mt-1 text-muted">
              {formatDate(sessions[active].date)}
              {sessions[active].weightKg ? ` · ${sessions[active].weightKg} kg × ${sessions[active].reps}` : ''}
            </p>
          </div>
        )}
      </div>
      {/* Wrapped: a table ignores the 1px width of sr-only and would widen the page */}
      <div className="sr-only">
        <table>
          <caption>{exercise.name} per workout</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, i) => (
              <tr key={i}>
                <td>{formatDate(session.date)}</td>
                {series.map((s) => (
                  <td key={s.key}>
                    {s.values[i]} {s.unit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export default ProgressLine;
