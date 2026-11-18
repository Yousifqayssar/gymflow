import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Apple, CalendarDays, ClipboardList, CreditCard, Dumbbell, Gift, House, LogOut, MapPin, QrCode, ReceiptText, ScanLine, TrendingUp, UserRound, Users, X } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import Avatar from './ui/Avatar.jsx';
import Logo from './ui/Logo.jsx';
import ThemeToggle from './ui/ThemeToggle.jsx';
import { PageTransition } from './ui/motion.jsx';
import SiteFooter from './SiteFooter.jsx';
import BottomTabBar from './BottomTabBar.jsx';

// Menu entries, their icons and which roles can see them. New pages are added here.
const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/my-qr', label: 'My QR', icon: QrCode, roles: ['MEMBER'] },
  { to: '/membership', label: 'Membership', icon: CreditCard, roles: ['MEMBER'] },
  { to: '/rewards', label: 'Rewards', icon: Gift, roles: ['MEMBER'] },
  { to: '/check-in', label: 'Check-in', icon: ScanLine, roles: ['ADMIN', 'TRAINER'] },
  { to: '/classes', label: 'Classes', icon: CalendarDays, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/food', label: 'Food', icon: Apple, roles: ['MEMBER', 'TRAINER'] },
  { to: '/workouts', label: 'Workouts', icon: ClipboardList, roles: ['ADMIN', 'TRAINER', 'MEMBER'] },
  { to: '/progress', label: 'Progress', icon: TrendingUp, roles: ['MEMBER'] },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell, roles: ['ADMIN', 'TRAINER'] },
  { to: '/people', label: 'People', icon: Users, roles: ['ADMIN'] },
  { to: '/plans', label: 'Plans', icon: CreditCard, roles: ['ADMIN'] },
  { to: '/payments', label: 'Payments', icon: ReceiptText, roles: ['ADMIN'] },
  { to: '/locations', label: 'Locations', icon: MapPin, roles: ['ADMIN'] },
  // Not in the desktop bar: there the avatar at the top right opens the profile (saves space).
  { to: '/profile', label: 'Profile', icon: UserRound, roles: ['ADMIN', 'TRAINER', 'MEMBER'], phoneOnly: true },
];

// Phones and tablets: the 4 pages each role uses most, in the bottom tab bar. Everything else is under "More".
// `featured`: the big round button in the middle (members show their QR code at the entrance every visit).
const TABS = {
  MEMBER: ['/', '/classes', { to: '/my-qr', featured: true }, '/workouts'],
  TRAINER: ['/', '/check-in', '/classes', '/workouts'],
  ADMIN: ['/', '/check-in', '/people', '/payments'],
};

const ROLE_LABELS = { ADMIN: 'Admin', TRAINER: 'Trainer', MEMBER: 'Member' };

// Is `pathname` this page or one of its sub-pages (/classes/12 belongs to /classes)?
const isOnPage = (pathname, to) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`));

// Shared frame for every page after login. The layout switches at the lg breakpoint (1024 px):
// Desktop (lg and up): navigation bar at the top, footer at the bottom.
// Phones and tablets: app-style – a bottom tab bar with the main pages; "More" opens a sheet with the rest.
function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const tabs = TABS[user.role].map((tab) => {
    const { to, featured = false } = typeof tab === 'string' ? { to: tab } : tab;
    return { ...items.find((item) => item.to === to), featured };
  });
  const moreItems = items.filter((item) => !tabs.some((tab) => tab.to === item.to));
  const isMoreActive = !tabs.some((tab) => isOnPage(location.pathname, tab.to));
  // With many menu items (members have 8), the icons only fit on very wide screens.
  const desktopIconClass = items.filter((item) => !item.phoneOnly).length > 7 ? 'hidden size-4 2xl:block' : 'hidden size-4 xl:block';

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

  // A new page closes the "More" sheet (also when the page changes through the back button).
  const [shownPath, setShownPath] = useState(location.pathname);
  if (shownPath !== location.pathname) {
    setShownPath(location.pathname);
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Keyboard users can jump straight past the menu to the page content (WCAG 2.4.1). */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-3 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-brand-700 focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-white focus-visible:shadow-lg"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
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
                {/* Icons only on wide screens; on smaller ones the labels need the space */}
                <item.icon className={desktopIconClass} aria-hidden="true" />
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

      {/* ---------- Phones: "More" sheet sliding up from the bottom ---------- */}
      <div className={`fixed inset-0 z-40 lg:hidden ${isMenuOpen ? '' : 'pointer-events-none'}`}>
        {/* Dark background; tapping it closes the sheet */}
        <div
          onClick={closeMenu}
          aria-hidden="true"
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
        />

        <aside
          id="more-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="More"
          // `inert` makes the hidden sheet unreachable with the keyboard while it is closed.
          inert={!isMenuOpen}
          className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] max-w-lg flex-col overflow-y-auto rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* The small handle at the top shows it is a sheet */}
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-4" aria-hidden="true" />
          <div className="flex items-center gap-3 px-5 pt-4 pb-1">
            <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted">{ROLE_LABELS[user.role]}</p>
            </div>
            <button type="button" onClick={closeMenu} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-surface-3 hover:text-ink">
              <X className="size-5" />
            </button>
          </div>

          {/* The pages that are not in the tab bar, as big tiles that are easy to tap */}
          <nav className="grid grid-cols-3 gap-2 p-4" aria-label="More pages">
            {moreItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-sm font-medium transition active:scale-[0.97] ${
                    isActive
                      ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-line bg-surface-2 text-ink-2 hover:bg-surface-3'
                  }`
                }
              >
                <item.icon className="size-6" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
            <ThemeToggle withLabel className="w-full justify-center border border-line-strong py-2.5" />
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </aside>
      </div>

      <BottomTabBar tabs={tabs} isMoreActive={isMoreActive} isMoreOpen={isMenuOpen} onMore={() => setIsMenuOpen((open) => !open)} />

      {/* ---------- Page content ---------- */}
      {/* Phones: extra space at the bottom, so the tab bar never covers the end of the page */}
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none sm:px-6 lg:px-8 lg:py-10">
        {/* The key makes the animation start again on every new page */}
        <PageTransition key={location.pathname}>
          {/* Pages are loaded on demand (see App.jsx); this shows while one is downloading */}
          <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface-3" aria-label="Loading page" />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>

      {/* The website footer only on desktop: on phones the app has its tab bar instead */}
      <div className="hidden lg:block">
        <SiteFooter links={items} />
      </div>
    </div>
  );
}

export default AppLayout;
