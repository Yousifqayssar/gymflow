import { createContext } from 'react';

// Lets any component show a short message. Provided by <ToastProvider>, used with useToast().
export const ToastContext = createContext(null);
