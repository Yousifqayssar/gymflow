import { useContext } from 'react';
import { ToastContext } from './ToastContext.js';

// Example: const showToast = useToast(); showToast('Plan created');
export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return showToast;
}
