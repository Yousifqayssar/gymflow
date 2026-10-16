import { Dumbbell } from 'lucide-react';

// The GymFlow logo: a dumbbell in a green square, followed by the name.
// `inverted` is for dark/green backgrounds (white square, green icon).
function Logo({ inverted = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${
          inverted ? 'bg-white text-brand-700' : 'bg-brand-600 text-white'
        }`}
      >
        <Dumbbell className="size-5" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${inverted ? 'text-white' : 'text-slate-900'}`}>GymFlow</span>
    </span>
  );
}

export default Logo;
