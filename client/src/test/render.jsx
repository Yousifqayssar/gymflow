// Renders a component the way the app does: inside a router, with a logged-in user and toasts.
// Returns everything from Testing Library, plus `showToast` (a mock) to check the messages.
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { AuthContext } from '../auth/AuthContext.js';
import { ToastContext } from '../components/ui/ToastContext.js';

export const TEST_MEMBER = { id: 7, firstName: 'Elif', lastName: 'Yilmaz', role: 'MEMBER', email: 'elif@demo.gymflow.local' };

export function renderWithApp(ui, { user = TEST_MEMBER, route = '/' } = {}) {
  const showToast = vi.fn();
  const auth = { user, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn(), updateCurrentUser: vi.fn() };
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext value={auth}>
        <ToastContext value={showToast}>{ui}</ToastContext>
      </AuthContext>
    </MemoryRouter>,
  );
  return { ...result, showToast };
}
