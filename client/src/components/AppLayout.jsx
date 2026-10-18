import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Apple, CalendarDays, ClipboardList, CreditCard, Dumbbell, Gift, House, LogOut, MapPin, Menu, QrCode, ScanLine, UserRound, Users, X } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import Avatar from './ui/Avatar.jsx';
import Logo from './ui/Logo.jsx';
import ThemeToggle from './ui/ThemeToggle.jsx';
import { PageTransition } from './ui/motion.jsx';
import SiteFooter from './SiteFooter.jsx';

// Menu entries, their icons and which roles can see them. New pages are added here.
const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/my-qr', label: 'My QR', icon: QrCode, roles: ['MEMBER'] },
  { to: '/rewards', label: 'Rewards', icon: Gift, roles: ['MEMBER'] },
  { to: '/check-in', label: 'Check-in', icon: ScanLine, roles: ['ADMIN', 'TRAINER'] },
  { to: '/classes', label: 'Classes', icon: CalendarDays, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/food', label: 'Food', icon: Apple, roles: ['MEMBER', 'TRAINER'] },
  { to: '/workouts', label: 'Workouts', icon: ClipboardList, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell, roles: ['ADMIN', 'TRAINER'] },
  { to: '/people', label: 'People', icon: Users, roles: ['ADMIN'] },
  { to: '/plans', label: 'Plans', icon: CreditCard, roles: ['ADMIN'] },
  { to: '/locations', label: 'Locations', icon: MapPin, roles: ['ADMIN'] },
  // Not in the desktop bar: there the avatar at the top right opens the profile (saves space).
  { to: '/profile', label: 'Profile', icon: UserRound, roles: ['ADMIN', 'TRAINER', 'MEMBER'], phoneOnly: true },
];

const ROLE_LABELS = { ADMIN: 'Admin', TRAINER: 'Trainer', MEMBER: 'Member' };

// Shared frame for every page after login.
// Desktop (lg and up): navigation bar at the top.
// Phones and tablets: a ☰ button that opens a menu sliding in from the left.
function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
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
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Phone: menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="-ml-2 rounded-lg p-2 text-ink-3 hover:bg-surface-3 hover:text-ink lg:hidden"
          >
            <Menu className="size-6" />
          </button>

          <Logo />

          {/* Desktop: menu items in the bar */}
          <nav className="ml-4 hidden items-center gap-0.5 lg:flex xl:ml-6 xl:gap-1" aria-label="Main">
            {items.filter((item) => !item.phoneOnly).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors xl:px-3 ${
                    isActive ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'text-ink-3 hover:bg-surface-3 hover:text-ink'
                  }`
                }
              >
                {/* Icons only on wide screens; between lg and xl the labels need the space */}
                <item.icon className="hidden size-4 xl:block" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: light/dark switch, user (links to the profile) and logout */}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              to="/profile"
              title="My profile"
              className="flex items-center gap-3 rounded-lg p-1 hover:bg-surface-3 lg:px-2"
            >
              {/* The name only on wide screens; between lg and xl the menu needs the space */}
              <span className="hidden text-right xl:block">
                <span className="block max-w-36 truncate whitespace-nowrap text-sm font-medium leading-tight text-ink">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-xs text-muted">{ROLE_LABELS[user.role]}</span>
              </span>
              <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} size="sm" />
            </Link>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="hidden rounded-lg p-2 text-faint hover:bg-surface-3 hover:text-ink-2 lg:block"
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
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-surface shadow-xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo />
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="rounded-lg p-2 text-muted hover:bg-surface-3 hover:text-ink"
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
                    isActive ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'text-ink-2 hover:bg-surface-3'
                  }`
                }
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-line p-4">
            <div className="flex items-center gap-3">
              <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-muted">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <ThemeToggle withLabel className="mt-4 w-full justify-center border border-line-strong py-2.5" />
            <button
              type="button"
              onClick={logout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </aside>
      </div>

      {/* ---------- Page content ---------- */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* The key makes the animation start again on every new page */}
        <PageTransition key={location.pathname}>
          {/* Pages are loaded on demand (see App.jsx); this shows while one is downloading */}
          <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface-3" aria-label="Loading page" />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>

      <SiteFooter links={items} />
    </div>
  );
}

export default AppLayout;
