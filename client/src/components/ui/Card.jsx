// A white box with a subtle border and shadow. Optional title row with actions.
//   <Card title="Membership history">…</Card>
//   <Card padded={false}>…</Card>   for lists and tables that go edge to edge
function Card({ title, description, actions, padded = true, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div>
            {title && <h2 className="font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export default Card;
