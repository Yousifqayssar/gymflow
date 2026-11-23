import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { m } from 'motion/react';
import { ArrowLeft, CalendarDays, Gift, QrCode } from 'lucide-react';
import Logo from './ui/Logo.jsx';
import PageTitle from './ui/PageTitle.jsx';
import ThemeToggle from './ui/ThemeToggle.jsx';
import { GYM } from '../config/gym.js';

// The 3D dumbbell uses three.js (a big library): it is downloaded separately, after the form is
// already on screen, so logging in never has to wait for it.
const Dumbbell3D = lazy(() => import('./auth/Dumbbell3D.jsx'));

// The brand panel (and its 3D scene) is only shown on wide screens, the same width as Tailwind's `lg`.
const wideScreen = window.matchMedia('(min-width: 1024px)');

// True while the window is wide enough for the brand panel; follows resizing.
function useIsWideScreen() {
  const [isWide, setIsWide] = useState(wideScreen.matches);
  useEffect(() => {
    const handleChange = (event) => setIsWide(event.matches);
    wideScreen.addEventListener('change', handleChange);
    return () => wideScreen.removeEventListener('change', handleChange);
  }, []);
  return isWide;
}

// Calculated once when the app loads; components should not read the clock while rendering.
const CURRENT_YEAR = new Date().getFullYear();

const FEATURES = [
  { icon: QrCode, text: 'QR check-in' },
  { icon: CalendarDays, text: 'Class booking' },
  { icon: Gift, text: 'Loyalty rewards' },
];

// Layout of the login and register pages.
// Desktop: form on the left, a dark brand panel with a turning 3D dumbbell on the right.
// Phones: the form with a small brand header.
// `tabTitle` is the browser tab title, e.g. "Log in".
function AuthCard({ title, tabTitle, subtitle, children }) {
  // Phones never download or run the 3D scene (it would be hidden anyway and only cost battery).
  const isWideScreen = useIsWideScreen();

  return (
    <div className="flex min-h-screen bg-canvas">
      <PageTitle>{tabTitle}</PageTitle>

      {/* ---------- Form side ---------- */}
      <main className="relative isolate flex flex-1 flex-col overflow-hidden px-6 py-8 sm:px-12 lg:flex-none lg:basis-[46%] xl:px-20">
        {/* Soft brand-coloured glow behind the form */}
        <div aria-hidden="true" className="absolute -top-40 -left-40 -z-10 size-96 rounded-full bg-brand-400/20 blur-3xl" />

        {/* Visitors can always go back to the public front page: by the logo or the "Back" link. */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/welcome"
            aria-label="GymFlow front page"
            className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/welcome"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-3 transition hover:bg-surface-3 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to the front page</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto my-auto w-full max-w-sm py-10"
        >
          <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">{GYM.name}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/30">{children}</div>
        </m.div>

        <p className="text-center text-xs text-faint lg:text-left">
          © {CURRENT_YEAR} {GYM.name}
        </p>
      </main>

      {/* ---------- Brand side (desktop only) ---------- */}
      <aside className="relative isolate hidden flex-1 flex-col overflow-hidden border-l border-white/10 bg-slate-950 text-white lg:flex">
        {/* Green light from below and a fine grid, like a modern gym floor at night */}
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_50%_60%,rgb(16_185_129/0.35),transparent_60%)]" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />

        <div className="relative flex-1">
          {isWideScreen && (
            <Suspense fallback={<div className="absolute inset-0 m-auto size-48 animate-pulse rounded-full bg-brand-500/20 blur-2xl" />}>
              <Dumbbell3D className="absolute inset-0" />
            </Suspense>
          )}
        </div>

        <div className="relative px-12 pb-12 xl:px-16">
          <h2 className="font-display text-5xl leading-[0.95] font-bold tracking-tight xl:text-6xl">
            Train smarter.
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-cyan-300 bg-clip-text text-transparent">Feel stronger.</span>
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/70">
            Memberships, check-ins, classes and rewards – your whole gym in one app.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/15 backdrop-blur-md">
                <Icon className="size-4 text-brand-300" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default AuthCard;
