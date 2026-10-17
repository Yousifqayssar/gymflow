import { ProgressFill } from '../ui/motion.jsx';

// "6 of 15 spots left" with a small bar showing how full the class is.
function SpotsBar({ capacity, bookedCount, spotsLeft }) {
  const percentFull = Math.round((bookedCount / capacity) * 100);
  const isFull = spotsLeft === 0;
  const isAlmostFull = !isFull && spotsLeft <= 3;

  const color = isFull ? 'bg-red-500' : isAlmostFull ? 'bg-amber-500' : 'bg-brand-500';
  const text = isFull ? 'Full' : `${spotsLeft} of ${capacity} spots left`;

  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className={`font-medium ${isFull ? 'text-red-600 dark:text-red-400' : isAlmostFull ? 'text-amber-700 dark:text-amber-300' : 'text-ink-3'}`}>{text}</span>
        <span className="text-faint">{bookedCount} booked</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <ProgressFill percent={percentFull} className={color} />
      </div>
    </div>
  );
}

export default SpotsBar;
