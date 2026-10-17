// Like FormField, but for longer text over several lines (descriptions, notes).
// Shows "120 / 500" when `maxLength` is set, so the user knows how much space is left.
function TextAreaField({ label, name, error, hint, value = '', maxLength, rows = 3, ...props }) {
  const errorId = `${name}-error`;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={name} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
        {maxLength && (
          <span className="text-xs text-faint">
            {value.length} / {maxLength}
          </span>
        )}
      </div>
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-ink shadow-sm outline-none transition placeholder:text-faint focus:ring-4 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/25'
            : 'border-line-strong focus:border-brand-500 focus:ring-brand-100 dark:focus:ring-brand-500/25'
        }`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default TextAreaField;
