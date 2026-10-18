import { Link } from 'react-router';
import { ArrowRight, CalendarDays, QrCode, ScanLine } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { useApiData } from '../hooks/useApiData.js';
import { getMyVisits } from '../api/me.js';
import { listTodaysCheckIns } from '../api/checkIns.js';
import AdminHome from '../components/AdminHome.jsx';
import LevelCard from '../components/LevelCard.jsx';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import MyNextClasses from '../components/classes/MyNextClasses.jsx';
import TodaysCheckIns from '../components/checkIn/TodaysCheckIns.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

// A big dark button for the most important action of a role, e.g. "Show my QR code".
function ShortcutCard({ to, icon: Icon, title, text, className = '' }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-md ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg dark:bg-brand-700 dark:hover:bg-brand-600 ${className}`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-white/70">{text}</span>
      </span>
      <ArrowRight className="size-5 transition group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

// A quieter link row, e.g. "View my profile and visits".
function LinkRow({ to, children }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-medium text-ink-2 shadow-sm transition hover:bg-surface-2"
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

// Members: membership card, loyalty level, QR code shortcut and next classes.
function MemberHome({ user }) {
  const { data: visits } = useApiData(getMyVisits);
  const qrShortcut = { to: '/my-qr', icon: QrCode, title: 'Show my QR code', text: 'Check in at the entrance' };

  return (
    <div>
      <PageHeader title={`Hi, ${user.firstName}!`} tabTitle="Home" description="Ready for your next workout?" />
      {/* Phones: the QR code is what members need at the gym door, so it comes first */}
      <ShortcutCard {...qrShortcut} className="mb-6 lg:hidden" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <MyMembershipCard />
          <MyNextClasses />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <ShortcutCard {...qrShortcut} className="hidden lg:flex" />
          <LevelCard visits={visits} />
          <LinkRow to="/profile">View my profile and visits</LinkRow>
        </div>
      </div>
    </div>
  );
}

// Trainers: checking members in at the door, today's visitors and the class schedule.
function TrainerHome({ user }) {
  const { data: today, error } = useApiData(listTodaysCheckIns);

  return (
    <div>
      <PageHeader title={`Welcome, ${user.firstName}`} tabTitle="Home" description="Good to have you on the team." />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <ShortcutCard to="/check-in" icon={ScanLine} title="Check members in" text="Scan QR codes at the entrance" />
          <LinkRow to="/classes">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted" aria-hidden="true" />
              Class schedule
            </span>
          </LinkRow>
        </div>
        <div className="lg:col-span-3">
          <TodaysCheckIns today={today} error={error} limit={8} />
        </div>
      </div>
    </div>
  );
}

// First page after login: a different home for each role.
function HomePage() {
  const { user } = useAuth();

  if (user.role === 'ADMIN') return <AdminHome user={user} />;
  if (user.role === 'TRAINER') return <TrainerHome user={user} />;
  return <MemberHome user={user} />;
}

export default HomePage;
