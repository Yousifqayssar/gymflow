import { Inbox } from 'lucide-react';

// Shown instead of an empty list: an icon, a short message and an optional action.
function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-3 text-faint">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
