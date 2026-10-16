import { NavLink, Outlet } from 'react-router';
import { CreditCard, House, LogOut, Users } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import Avatar from './ui/Avatar.jsx';
import Logo from './ui/Logo.jsx';

// Menu entries, their icons and which roles can see them. New pages are added here.
const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/people', label: 'People', icon: Users, roles: ['ADMIN'] },
  { to: '/plans', label: 'Plans', icon: CreditCard, roles: ['ADMIN'] },
];

const ROLE_LABELS = { ADMIN: 'Admin', TRAINER: 'Trainer', MEMBER: 'Member' };

// Shared frame for every page after login.
// Desktop (lg and up): fixed sidebar on the left.
// Phones and tablets: small top bar + app-like navigation bar at the bottom.
function AppLayout() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-6 py-5">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t border-slate-200 p-4">
          <Avatar firstName={user.firstName} lastName={user.lastName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </aside>

      {/* ---------- Phone top bar ---------- */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      {/* ---------- Page content ---------- */}
      {/* pb-24 on phones leaves room for the bottom navigation bar */}
      <main className="px-4 pt-6 pb-24 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10 lg:pb-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* ---------- Phone bottom navigation ---------- */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                isActive ? 'text-brand-700' : 'text-slate-500'
              }`
            }
          >
            <item.icon className="size-6" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppLayout;
