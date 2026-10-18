// The one button style of the app. Variants keep every page consistent.
//   <Button>Save</Button>                       primary (brand green)
//   <Button variant="secondary">Cancel</Button>  white with border
//   <Button variant="danger">Deactivate</Button> red text
//   <Button icon={Plus}>New plan</Button>        with an icon in front
//   <Button as={Link} to="/people">…</Button>    rendered as another element, e.g. a link

const VARIANTS = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 focus-visible:outline-brand-600',
  secondary: 'border border-line-strong bg-surface text-ink-2 shadow-sm hover:bg-surface-2 focus-visible:outline-slate-400',
  danger: 'border border-red-200 dark:border-red-500/30 bg-surface text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 focus-visible:outline-red-500',
  ghost: 'text-ink-3 hover:bg-surface-3 hover:text-ink focus-visible:outline-slate-400',
};

const SIZES = {
  sm: 'gap-1.5 px-3 py-1.5 text-sm',
  md: 'gap-2 px-4 py-2 text-sm',
};

function Button({ as: Component = 'button', variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props }) {
  // A real <button> defaults to type="submit" inside forms; make "button" the safe default.
  const typeProps = Component === 'button' ? { type: props.type ?? 'button' } : {};

  return (
    <Component
      {...props}
      {...typeProps}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
    </Component>
  );
}

export default Button;
