import { Link } from 'react-router';
import { ArrowRight, CircleCheck, Clock, MapPin } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { TiltCard } from '../ui/motion.jsx';
import ClassBanner from './ClassBanner.jsx';
import { CATEGORY_DISPLAY, formatDayHeading, formatStartsIn, formatTime } from '../../utils/classDisplay.js';

// The big "Up next" card at the top of the schedule: the member's next booked class
// (or simply the next class), with a live countdown. `now` is updated by the page.
function NextClassHero({ gymClass, now, isMine }) {
  const { icon: Icon, label } = CATEGORY_DISPLAY[gymClass.category];

  return (
    <TiltCard maxTilt={3} className="mb-8">
      <Link
        to={`/classes/${gymClass.id}`}
        className="group block overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 dark:ring-white/10"
      >
        <ClassBanner category={gymClass.category} size="banner" className="flex min-h-64 flex-col justify-between gap-10 p-6 sm:min-h-72 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {/* A softly pulsing dot: "this is live" */}
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/80" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              {isMine ? 'Your next class' : 'Up next'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </span>
            {isMine && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
                <CircleCheck className="size-3.5" aria-hidden="true" />
                Booked
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80">
                {formatDayHeading(gymClass.startsAt, now)} · {formatTime(gymClass.startsAt)} – {formatTime(gymClass.endsAt)}
              </p>
              <h2 className="mt-1 font-display text-4xl font-bold tracking-tight drop-shadow-sm sm:text-6xl">{gymClass.title}</h2>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />
                  {gymClass.location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Avatar firstName={gymClass.trainer.firstName} lastName={gymClass.trainer.lastName} avatar={gymClass.trainer.avatar} size="sm" />
                  {gymClass.trainer.firstName} {gymClass.trainer.lastName}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-black/30 px-4 py-3 backdrop-blur-md">
                <Clock className="size-5" aria-hidden="true" />
                <span>
                  <span className="block text-xs text-white/70">Starts</span>
                  <span className="block font-display text-2xl leading-none font-bold">{formatStartsIn(gymClass.startsAt, now)}</span>
                </span>
              </span>
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-lg transition group-hover:translate-x-1">
                <ArrowRight className="size-5 text-slate-900" aria-hidden="true" />
              </span>
            </div>
          </div>
        </ClassBanner>
      </Link>
    </TiltCard>
  );
}

export default NextClassHero;
