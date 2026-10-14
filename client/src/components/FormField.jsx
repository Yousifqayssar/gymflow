// A labelled input with an optional error message underneath.
// All other props (type, value, onChange, required, ...) are passed to the <input>.
function FormField({ label, name, error, ...inputProps }) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-slate-300 focus:border-slate-500 focus:ring-slate-200'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
