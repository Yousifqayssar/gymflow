import { useCallback, useEffect, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { ToastContext } from './ToastContext.js';

const VISIBLE_MS = 3500;
let nextId = 1;

// One message box. It removes itself after a few seconds.
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.tone === 'error';
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg">
      <Icon className={`size-5 shrink-0 ${isError ? 'text-red-600 dark:text-red-400' : 'text-brand-600 dark:text-brand-400'}`} aria-hidden="true" />
      <p className="text-sm font-medium text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="ml-2 rounded p-0.5 text-faint hover:text-ink-3"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// Keeps the list of visible messages and shows them in a corner of the screen.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // useCallback keeps the same function between renders, so the Toast timers aren't restarted.
  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, tone = 'success') => {
    setToasts((current) => [...current, { id: nextId++, message, tone }]);
  }, []);

  return (
    <ToastContext value={showToast}>
      {children}
      {/* aria-live: screen readers read new messages out loud */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}
