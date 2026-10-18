import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CalendarDays, Layers, MessageSquareText, Play } from 'lucide-react';
import { Link } from 'react-router';
import Avatar from '../ui/Avatar.jsx';
import PlanDayView from './PlanDayView.jsx';
import PlanTabs from './PlanTabs.jsx';
import { totalSets } from '../../utils/workoutDisplay.js';
import { formatDate } from '../../utils/format.js';

// A whole workout plan: title, who wrote it, the trainer's notes, and its days as tabs.
// `actions` (optional) is shown in the header, e.g. an Edit button for staff.
// `canStart`: the member's own plan – shows "Start workout" for the chosen day.
function PlanCard({ plan, actions, canStart = false }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = plan.days[selectedDay] ?? plan.days[0];

  return (
    <section className={`overflow-hidden rounded-3xl border border-line bg-surface shadow-sm ${plan.isActive ? '' : 'opacity-70'}`}>
      <header className="relative isolate overflow-hidden bg-gradient-to-br from-brand-700 to-slate-900 px-6 py-5 text-white">
        <Layers aria-hidden="true" strokeWidth={1} className="absolute -right-4 -bottom-8 -z-10 size-40 text-white/10" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-medium text-white/75">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {plan.days.length} {plan.days.length === 1 ? 'day' : 'days'} · updated {formatDate(plan.updatedAt)}
              {!plan.isActive && <span className="rounded-full bg-white/20 px-2 py-0.5 font-semibold">Inactive</span>}
            </p>
            <h2 className="mt-1 font-display text-3xl leading-tight font-bold tracking-tight">{plan.name}</h2>
            {plan.author && (
              <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
                <Avatar firstName={plan.author.firstName} lastName={plan.author.lastName} avatar={plan.author.avatar} size="sm" />
                Written by {plan.author.firstName} {plan.author.lastName}
              </p>
            )}
          </div>
          {actions}
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {plan.notes && (
          <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:bg-brand-500/10 dark:text-brand-200">
            <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {plan.notes}
          </p>
        )}
        <PlanTabs days={plan.days} selected={selectedDay} onSelect={setSelectedDay} layoutId={`plan-${plan.id}-tab`} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {day.exercises.length} exercises · {totalSets(day)} sets
          </p>
          {canStart && plan.isActive && (
            <Link
              to={`/workouts/${plan.id}/day/${day.id}`}
              className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-800 active:scale-[0.97]"
            >
              <Play className="size-4 fill-current transition-transform group-hover:scale-125" aria-hidden="true" />
              Start {day.name}
            </Link>
          )}
        </div>
        <AnimatePresence mode="wait">
          <m.div key={selectedDay} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12, transition: { duration: 0.12 } }}>
            <PlanDayView day={day} />
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default PlanCard;
