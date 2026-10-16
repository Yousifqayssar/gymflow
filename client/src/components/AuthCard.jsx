import { CalendarDays, QrCode, TrendingUp } from 'lucide-react';
import Logo from './ui/Logo.jsx';

// Calculated once when the app loads; components should not read the clock while rendering.
const CURRENT_YEAR = new Date().getFullYear();

const FEATURES = [
  { icon: QrCode, text: 'Check in with your personal QR code' },
  { icon: CalendarDays, text: 'Book your favourite classes' },
  { icon: TrendingUp, text: 'Follow your plan and see your progress' },
];

// Layout of the login and register pages.
// Desktop: form on the left, green brand panel on the right. Phones: only the form.
function AuthCard({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* ---------- Form side ---------- */}
      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:flex-none lg:basis-1/2 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>

      {/* ---------- Brand side (desktop only) ---------- */}
      <aside className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-brand-600 to-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Decorative circles in the background */}
        <div aria-hidden="true" className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" />

        <div className="relative">
          <Logo inverted />
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Train smarter.
            <br />
            Manage easier.
          </h2>
          <p className="mt-4 max-w-md text-lg text-brand-100">
            Memberships, check-ins, classes and workouts – everything your gym needs in one place.
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-brand-200">© {CURRENT_YEAR} GymFlow</p>
      </aside>
    </div>
  );
}

export default AuthCard;
