import { CircleAlert } from 'lucide-react';

// A red box for a general error, e.g. "Invalid email or password".
// role="alert" makes screen readers announce it immediately.
function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default ErrorMessage;
