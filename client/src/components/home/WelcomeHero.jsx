import { Link } from 'react-router';
import { m } from 'motion/react';
import { CalendarDays, Dumbbell, Footprints, MapPin, Users } from 'lucide-react';
import { GYM } from '../../config/gym.js';
import { CATEGORY_DISPLAY } from '../../utils/classDisplay.js';
import { openingStatus } from '../../utils/openingHours.js';
import { AnimatedNumber } from '../ui/motion.jsx';

const STAT_TILES = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'trainers', label: 'Trainers', icon: Dumbbell },
  { key: 'classesThisWeek', label: 'Classes this week', icon: CalendarDays },
  { key: 'visitsThisMonth', label: 'Visits this month', icon: Footprints },
];

// The big photo banner at the top of every home page: greeting, the gym's tagline, whether
// the gym is open right now, the main actions of the role, and live numbers from GET /api/gym/stats.
//   actions: [{ to, label, icon, primary }]
function WelcomeHero({ title, stats, actions, now }) {
  const status = openingStatus(now);

  return (
    <section className="relative isolate mb-8 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
      <img src={CATEGORY_DISPLAY.STRENGTH.photo} alt="" className="absolute inset-0 -z-30 size-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-brand-900/50" />
      {/* Two soft, slowly moving lights in the brand colour */}
      <m.div
        aria-hidden="true"
        animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-brand-500/30 blur-3xl"
      />
      <m.div
        aria-hidden="true"
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 left-1/3 -z-10 size-72 rounded-full bg-sky-500/15 blur-3xl"
      />

      <div className="px-6 pt-8 pb-6 sm:px-10 sm:pt-12">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-md">
            <MapPin className="size-3.5" aria-hidden="true" />
            {GYM.name} · {GYM.address[1]}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md ${
              status.isOpen ? 'bg-brand-500/25 text-brand-100' : 'bg-white/10 text-white/80'
            }`}
          >
            <span className={`size-2 rounded-full ${status.isOpen ? 'bg-brand-400 motion-safe:animate-pulse' : 'bg-white/50'}`} />
            {status.text}
          </span>
        </div>

        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg text-white/75">{GYM.tagline}</p>

        <div className="mt-7 flex flex-wrap gap-3">
          {actions.map(({ to, label, icon: Icon, primary }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition active:scale-[0.97] ${
                primary
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400'
                  : 'bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-white/20'
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Live numbers on frosted glass */}
      <dl className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
        {STAT_TILES.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-3 bg-slate-950/40 px-6 py-5 backdrop-blur-md sm:px-8">
            <Icon className="size-5 shrink-0 text-brand-300" aria-hidden="true" />
            <div>
              <dd className="font-display text-3xl leading-none font-bold">
                {stats ? <AnimatedNumber value={stats[key]} /> : '–'}
              </dd>
              <dt className="mt-1 text-xs text-white/65">{label}</dt>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default WelcomeHero;
