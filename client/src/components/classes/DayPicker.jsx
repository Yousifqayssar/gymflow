import { m } from 'motion/react';
import { dayParts } from '../../utils/classDisplay.js';

// A row of days ("Sat 24 · 3 classes"); one day of the schedule is shown at a time.
// `days` is [{ key, startsAt, count, hasMine }]. The green highlight slides to the chosen day
// (Motion's `layoutId`: the same element moves between buttons instead of appearing and disappearing).
function DayPicker({ days, selectedKey, onSelect, todayKey }) {
  return (
    <div
      role="tablist"
      aria-label="Choose a day"
      className="-mx-4 mb-6 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pt-1 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0"
    >
      {days.map((day) => {
        const { weekday, day: number, month } = dayParts(day.startsAt);
        const isSelected = day.key === selectedKey;
        return (
          <button
            key={day.key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(day.key)}
            className={`relative flex w-[4.5rem] shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-2.5 transition-colors ${
              isSelected ? 'border-transparent text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-surface-2'
            }`}
          >
            {isSelected && (
              <m.span
                layoutId="day-picker-highlight"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 -z-0 rounded-2xl bg-gradient-to-b from-brand-700 to-brand-900 shadow-md shadow-brand-700/30"
              />
            )}
            <span className={`relative text-xs font-medium ${isSelected ? 'text-white/85' : 'text-muted'}`}>
              {day.key === todayKey ? 'Today' : weekday}
            </span>
            <span className="relative font-display text-2xl leading-tight font-bold">{number}</span>
            <span className={`relative text-[0.7rem] ${isSelected ? 'text-white/80' : 'text-faint'}`}>{month}</span>
            {/* One dot per class (max 4), green when the member booked one of them */}
            <span className="relative mt-1 flex gap-0.5" aria-label={`${day.count} classes`}>
              {Array.from({ length: Math.min(day.count, 4) }, (_, i) => (
                <span
                  key={i}
                  className={`size-1 rounded-full ${isSelected ? 'bg-white/90' : day.hasMine ? 'bg-brand-500' : 'bg-surface-4'}`}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default DayPicker;
