import { CalendarDays, Clock, Dumbbell, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { GYM, HIGHLIGHTS, OPENING_HOURS } from '../../config/gym.js';
import { gymWeekdayAndTime } from '../../utils/openingHours.js';
import { Stagger, StaggerItem, TiltCard } from '../ui/motion.jsx';

const HIGHLIGHT_STYLE = {
  equipment: { icon: Dumbbell, gradient: 'from-brand-400 to-brand-700' },
  trainers: { icon: ShieldCheck, gradient: 'from-sky-400 to-blue-600' },
  classes: { icon: CalendarDays, gradient: 'from-violet-400 to-fuchsia-600' },
  flexible: { icon: Sparkles, gradient: 'from-amber-400 to-orange-600' },
};

// "About us": the gym's story, what makes it special, opening hours and how to reach it.
function AboutSection({ now }) {
  const { weekday } = gymWeekdayAndTime(now);

  return (
    <section aria-labelledby="about-heading" className="mt-14">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">About us</p>
          <h2 id="about-heading" className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            More than a gym since {GYM.founded}
          </h2>
          <p className="mt-4 leading-relaxed text-ink-3">{GYM.about}</p>
        </div>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {HIGHLIGHTS.map((item) => {
            const { icon: Icon, gradient } = HIGHLIGHT_STYLE[item.key];
            return (
              <StaggerItem key={item.key}>
                <TiltCard maxTilt={6} className="h-full">
                  <div className="h-full rounded-2xl border border-line bg-surface p-5 shadow-sm">
                    <span className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
                  </div>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            <Clock className="size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            Opening hours
          </h3>
          <ul className="mt-4 divide-y divide-line-soft">
            {OPENING_HOURS.map((row) => {
              const isToday = row.days.includes(weekday);
              return (
                <li key={row.label} className={`flex justify-between py-2.5 text-sm ${isToday ? 'font-semibold text-ink' : 'text-ink-3'}`}>
                  <span className="flex items-center gap-2">
                    {row.label}
                    {isToday && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
                        Today
                      </span>
                    )}
                  </span>
                  <span className="font-mono">
                    {row.open} – {row.close}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            <MapPin className="size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            Visit us
          </h3>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden="true" />
              <span className="text-ink-2">
                {GYM.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden="true" />
              <a href={`tel:${GYM.phone.replaceAll(' ', '')}`} className="inline-flex min-h-6 items-center text-ink-2 hover:text-brand-700 dark:hover:text-brand-300">
                {GYM.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden="true" />
              <a href={`mailto:${GYM.email}`} className="inline-flex min-h-6 items-center text-ink-2 hover:text-brand-700 dark:hover:text-brand-300">
                {GYM.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
