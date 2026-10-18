import { m } from 'motion/react';

// Tabs for the days of a plan ("Day A – Push", "Day B – Pull" …); the highlight slides to the chosen day.
// `layoutId` must be different for each tab bar on the same page.
function PlanTabs({ days, selected, onSelect, layoutId, children }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Training days">
      {days.map((day, index) => {
        const isSelected = index === selected;
        return (
          <button
            key={day.key ?? day.id ?? index}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(index)}
            className={`relative shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${isSelected ? 'text-white' : 'text-ink-3 hover:bg-surface-3 hover:text-ink'}`}
          >
            {isSelected && <m.span layoutId={layoutId} transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-xl bg-brand-700 shadow-md" />}
            <span className="relative">{day.name || `Day ${index + 1}`}</span>
          </button>
        );
      })}
      {children}
    </div>
  );
}

export default PlanTabs;
