import { Link } from 'react-router';
import { Ban, CircleCheck, MapPin } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import ClassBanner from './ClassBanner.jsx';
import SpotsBar from './SpotsBar.jsx';
import { CATEGORY_DISPLAY, formatTime, LEVEL_LABELS } from '../../utils/classDisplay.js';

// One class in the schedule: a colourful header with the time, then the details.
// The whole card links to the class detail page. On the schedule it sits inside a <TiltCard> (3D hover).
function ClassCard({ gymClass }) {
  const { isCancelled, isBookedByMe } = gymClass;
  const { icon: Icon, label } = CATEGORY_DISPLAY[gymClass.category];

  return (
    <Link
      to={`/classes/${gymClass.id}`}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-xl ${
        isBookedByMe && !isCancelled ? 'border-brand-400 ring-2 ring-brand-200 dark:ring-brand-500/30' : 'border-line'
      } ${isCancelled ? 'opacity-60 grayscale' : ''}`}
    >
      <ClassBanner category={gymClass.category} className="h-40 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </span>
          {isCancelled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
              <Ban className="size-3.5" aria-hidden="true" />
              Cancelled
            </span>
          )}
          {!isCancelled && isBookedByMe && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-sm">
              <CircleCheck className="size-3.5" aria-hidden="true" />
              Booked
            </span>
          )}
        </div>
        <p className="absolute bottom-3 left-4 drop-shadow-sm">
          <span className="font-display text-4xl font-bold tracking-tight">{formatTime(gymClass.startsAt)}</span>
          <span className="ml-1.5 text-sm font-medium text-white/85">– {formatTime(gymClass.endsAt)}</span>
        </p>
      </ClassBanner>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className={`text-lg font-semibold leading-snug text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300 ${isCancelled ? 'line-through' : ''}`}>
            {gymClass.title}
          </p>
          {/* The meeting point may wrap: it is important information, so it is never cut off. */}
          <p className="mt-0.5 flex items-start gap-1 text-sm text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {gymClass.location}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-ink-3">
            <Avatar firstName={gymClass.trainer.firstName} lastName={gymClass.trainer.lastName} avatar={gymClass.trainer.avatar} size="sm" />
            <span className="truncate">
              {gymClass.trainer.firstName} {gymClass.trainer.lastName}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-medium text-ink-3">
            {LEVEL_LABELS[gymClass.level]}
          </span>
        </div>

        {!isCancelled && (
          <div className="mt-auto">
            <SpotsBar capacity={gymClass.capacity} bookedCount={gymClass.bookedCount} spotsLeft={gymClass.spotsLeft} />
          </div>
        )}
      </div>
    </Link>
  );
}

export default ClassCard;
