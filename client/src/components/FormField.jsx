// A labelled input with an optional hint or error message underneath.
// All other props (type, value, onChange, required, ...) are passed to the <input>.
function FormField({ label, name, error, hint, ...inputProps }) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-ink shadow-sm outline-none transition placeholder:text-faint focus:ring-4 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/25'
            : 'border-line-strong focus:border-brand-500 focus:ring-brand-100 dark:focus:ring-brand-500/25'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export default FormField;
