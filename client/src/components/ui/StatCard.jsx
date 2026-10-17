// A big number with a label and an icon, e.g. "12 Active members".
// When `onClick` is given, the card is a button (e.g. to filter a list).
import { AnimatedNumber } from './motion.jsx';

const TONES = {
  brand: 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
  slate: 'bg-surface-3 text-ink-3',
};

function StatCard({ label, value, icon: Icon, tone = 'brand', onClick, isSelected = false }) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': isSelected } : {})}
      className={`flex w-full items-center gap-4 rounded-2xl border bg-surface p-4 text-left shadow-sm ${
        isSelected ? 'border-brand-500 ring-2 ring-brand-100 dark:ring-brand-500/25' : 'border-line'
      } ${onClick ? 'transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:translate-y-0' : ''}`}
    >
      {Icon && (
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-display text-3xl font-bold leading-tight text-ink">{value === undefined || value === null ? '–' : <AnimatedNumber value={value} />}</span>
        <span className="block truncate text-sm text-muted">{label}</span>
      </span>
    </Component>
  );
}

export default StatCard;
