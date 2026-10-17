// A labelled dropdown in the same style as FormField.
// `options` is a list of [value, label] pairs.
function SelectField({ label, name, options, error, placeholder, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <select
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-ink shadow-sm outline-none transition focus:ring-4 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/25'
            : 'border-line-strong focus:border-brand-500 focus:ring-brand-100 dark:focus:ring-brand-500/25'
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default SelectField;
