// A big number with a label and an icon, e.g. "12 Active members".
// When `onClick` is given, the card is a button (e.g. to filter a list).
const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
};

function StatCard({ label, value, icon: Icon, tone = 'brand', onClick, isSelected = false }) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': isSelected } : {})}
      className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm ${
        isSelected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'
      } ${onClick ? 'transition hover:border-slate-300 hover:shadow' : ''}`}
    >
      {Icon && (
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-display text-3xl font-bold leading-tight text-slate-900">{value ?? '–'}</span>
        <span className="block truncate text-sm text-slate-500">{label}</span>
      </span>
    </Component>
  );
}

export default StatCard;
