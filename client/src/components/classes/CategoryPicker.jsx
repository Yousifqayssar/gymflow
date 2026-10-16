import { CircleCheck } from 'lucide-react';
import { CATEGORY_DISPLAY } from '../../utils/classDisplay.js';

// Choose a class category by clicking its photo. Works like a group of radio buttons
// (one choice), which is also how screen readers announce it.
function CategoryPicker({ value, onChange, error }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">Category</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup">
        {Object.entries(CATEGORY_DISPLAY).map(([key, { label, photo, icon: Icon }]) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(key)}
              className={`relative isolate h-20 overflow-hidden rounded-xl text-left text-white transition ${
                isSelected ? 'ring-4 ring-brand-500 ring-offset-2' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <img src={photo} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
              <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 to-black/10" />
              <span className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-sm font-semibold">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </span>
              {isSelected && <CircleCheck className="absolute top-2 right-2 size-5 rounded-full bg-brand-500" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}

export default CategoryPicker;
