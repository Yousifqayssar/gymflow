import { useEffect, useState } from 'react';
import { CalendarClock, Scale, Target } from 'lucide-react';
import { getMemberBody } from '../../api/body.js';
import Avatar from '../ui/Avatar.jsx';
import { bmiRange, formatKg, GOALS } from '../../utils/body.js';
import { formatDate } from '../../utils/format.js';

// For trainers writing a plan: who the member is and what they want (from the monthly body check-in).
function MemberGoalSummary({ member }) {
  const [state, setState] = useState({ memberId: null, body: null });

  useEffect(() => {
    let ignore = false;
    getMemberBody(member.id)
      .then((body) => {
        if (!ignore) setState({ memberId: member.id, body });
      })
      .catch(() => {
        if (!ignore) setState({ memberId: member.id, body: { latest: null } });
      });
    return () => {
      ignore = true;
    };
  }, [member.id]);

  const body = state.memberId === member.id ? state.body : null;
  const latest = body?.latest;
  const goal = latest ? GOALS[latest.goal] : null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar firstName={member.firstName} lastName={member.lastName} avatar={member.avatar} size="lg" />
        <div>
          <p className="font-display text-2xl leading-tight font-bold text-ink">
            {member.firstName} {member.lastName}
          </p>
          <p className="text-sm text-muted">Member</p>
        </div>
      </div>

      {!body && <div className="mt-4 h-20 animate-pulse rounded-xl bg-surface-3" />}
      {body && !latest && <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">No body details yet – ask the member to add them on their profile.</p>}
      {latest && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300">
            <goal.icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Goal:</span>
            <p className="font-semibold">{goal.label}</p>
            {latest.targetWeightKg && (
              <p className="ml-auto inline-flex items-center gap-1 text-xs">
                <Target className="size-3.5" aria-hidden="true" />
                {formatKg(latest.targetWeightKg)}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="flex items-center gap-1 text-xs text-muted">
              <Scale className="size-3.5" aria-hidden="true" />
              Weight · height
            </p>
            <p className="font-semibold text-ink">
              {formatKg(latest.weightKg)} · {latest.heightCm} cm
            </p>
          </div>
          <div className="rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="text-xs text-muted">BMI</p>
            <p className="font-semibold text-ink">
              {latest.bmi} <span className={`mt-1 block w-fit whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${bmiRange(latest.bmi).tone}`}>{bmiRange(latest.bmi).label}</span>
            </p>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Updated {formatDate(latest.recordedOn)}
          </div>
        </div>
      )}
    </section>
  );
}

export default MemberGoalSummary;
