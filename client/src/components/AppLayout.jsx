import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/useAuth.js';

// Menu entries and which roles can see them. New pages are added here.
const NAV_ITEMS = [
  { to: '/', label: 'Home', roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/plans', label: 'Plans', roles: ['ADMIN'] },
];

// Shared frame for every page after login: header with menu, then the page itself.
function AppLayout() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-lg font-bold text-slate-900">GymFlow</span>

          <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user.firstName} {user.lastName}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
