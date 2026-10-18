import { LayoutGrid } from 'lucide-react';
import { AnimatedNumber, TiltCard } from '../ui/motion.jsx';
import { MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';

const TILES = [
  { value: '', label: 'All', icon: LayoutGrid, gradient: 'from-slate-600 to-slate-900' },
  ...Object.entries(MUSCLE_GROUPS).map(([value, group]) => ({ value, ...group })),
];

// Muscle groups as coloured tiles with the number of exercises; choosing one filters the library.
// The chosen tile lifts and glows; the others fade a little.
function MuscleGroupTiles({ counts, total, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9" role="group" aria-label="Filter by muscle group">
      {TILES.map((tile) => {
        const isSelected = tile.value === value;
        const count = tile.value ? (counts[tile.value] ?? 0) : total;
        return (
          <TiltCard key={tile.value} maxTilt={12}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(tile.value)}
              className={`relative flex w-full flex-col items-start gap-2 overflow-hidden rounded-2xl bg-gradient-to-br p-3 text-left text-white transition duration-300 ${tile.gradient} ${
                isSelected ? '-translate-y-1 shadow-xl ring-2 ring-white/70 ring-offset-2 ring-offset-canvas' : value ? 'opacity-70 hover:opacity-100' : 'shadow-sm'
              }`}
            >
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
              <tile.icon aria-hidden="true" strokeWidth={1.25} className="absolute -right-2 -bottom-3 size-16 text-white/20" />
              <tile.icon className="relative size-5" aria-hidden="true" />
              <span className="relative">
                <span className="block font-display text-2xl leading-none font-bold">
                  <AnimatedNumber value={count} />
                </span>
                <span className="block text-xs font-medium text-white/90">{tile.label}</span>
              </span>
            </button>
          </TiltCard>
        );
      })}
    </div>
  );
}

export default MuscleGroupTiles;
