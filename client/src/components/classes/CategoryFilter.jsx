import { m } from 'motion/react';
import { LayoutGrid } from 'lucide-react';
import { CATEGORY_DISPLAY } from '../../utils/classDisplay.js';

const OPTIONS = [
  { value: '', label: 'All', icon: LayoutGrid },
  ...Object.entries(CATEGORY_DISPLAY).map(([value, display]) => ({ value, label: display.label, icon: display.icon })),
];

// Category chips with icons. Like the day picker, the dark highlight slides to the chosen chip.
function CategoryFilter({ value, onChange }) {
  return (
    <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by category">
      {OPTIONS.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              isSelected ? 'border-transparent text-surface' : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
            }`}
          >
            {isSelected && (
              <m.span
                layoutId="category-filter-highlight"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-ink"
              />
            )}
            <option.icon className="relative size-4" aria-hidden="true" />
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
