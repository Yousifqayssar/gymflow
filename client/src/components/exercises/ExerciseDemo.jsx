import { lazy, Suspense, useState } from 'react';
import { Move3d, Pause, Play } from 'lucide-react';

// The 3D part (three.js, ~140 kB compressed) is only downloaded when a demo is opened.
const ExerciseDemo3D = lazy(() => import('./ExerciseDemo3D.jsx'));

// A 3D demo of an exercise with Play/Pause and a hint that it can be turned.
//   <ExerciseDemo exercise={exercise} className="h-80" />
function ExerciseDemo({ exercise, className = 'h-80' }) {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-surface-2 to-surface-3 ${className}`}>
      <Suspense fallback={<div className="absolute inset-0 m-auto size-24 animate-pulse rounded-full bg-brand-500/20" />}>
        <ExerciseDemo3D exercise={exercise} isPlaying={isPlaying} className="absolute inset-0" />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-medium text-muted backdrop-blur">
          <Move3d className="size-3.5" aria-hidden="true" />
          Drag to turn
        </span>
        <button
          type="button"
          onClick={() => setIsPlaying((value) => !value)}
          aria-label={isPlaying ? 'Pause the demo' : 'Play the demo'}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg transition hover:bg-brand-800 active:scale-95"
        >
          {isPlaying ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5 fill-current" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default ExerciseDemo;
