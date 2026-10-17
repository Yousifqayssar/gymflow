import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { CalendarDays, CreditCard, House, LogOut, Menu, QrCode, ScanLine, UserRound, Users, X } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import Avatar from './ui/Avatar.jsx';
import Logo from './ui/Logo.jsx';

// Menu entries, their icons and which roles can see them. New pages are added here.
const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/my-qr', label: 'My QR', icon: QrCode, roles: ['MEMBER'] },
  { to: '/check-in', label: 'Check-in', icon: ScanLine, roles: ['ADMIN', 'TRAINER'] },
  { to: '/classes', label: 'Classes', icon: CalendarDays, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/people', label: 'People', icon: Users, roles: ['ADMIN'] },
  { to: '/plans', label: 'Plans', icon: CreditCard, roles: ['ADMIN'] },
  { to: '/profile', label: 'Profile', icon: UserRound, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
];

const ROLE_LABELS = { ADMIN: 'Admin', TRAINER: 'Trainer', MEMBER: 'Member' };

// Shared frame for every page after login.
// Desktop (lg and up): navigation bar at the top.
// Phones and tablets: a ☰ button that opens a menu sliding in from the left.
function AppLayout() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  // While the phone menu is open: close it with the Escape key, and stop the page behind it from scrolling.
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsMenuOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Phone: menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <Menu className="size-6" />
          </button>

          <Logo />

          {/* Desktop: menu items in the bar */}
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: user (links to the profile) and logout */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/profile"
              title="My profile"
              className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-100 lg:px-2"
            >
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium leading-tight text-slate-900">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-xs text-slate-500">{ROLE_LABELS[user.role]}</span>
              </span>
              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
            </Link>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:block"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Phone: slide-in menu ---------- */}
      <div className={`fixed inset-0 z-40 lg:hidden ${isMenuOpen ? '' : 'pointer-events-none'}`}>
        {/* Dark background; tapping it closes the menu */}
        <div
          onClick={closeMenu}
          aria-hidden="true"
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
        />

        <aside
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          // `inert` makes the hidden menu unreachable with the keyboard while it is closed.
          inert={!isMenuOpen}
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <Logo />
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="size-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3" aria-label="Main">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Avatar firstName={user.firstName} lastName={user.lastName} />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-slate-500">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </aside>
      </div>

      {/* ---------- Page content ---------- */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
