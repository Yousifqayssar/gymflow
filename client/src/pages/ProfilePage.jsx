import { Link } from 'react-router';
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Footprints,
  Hash,
  Mail,
  Maximize2,
  ScanLine,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { useApiData } from '../hooks/useApiData.js';
import { getMyVisits, listMyBookings } from '../api/me.js';
import { listUsers } from '../api/users.js';
import { listTodaysCheckIns } from '../api/checkIns.js';
import { listClasses } from '../api/classes.js';
import Avatar from '../components/ui/Avatar.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import LevelCard from '../components/LevelCard.jsx';
import MemberQrCode from '../components/MemberQrCode.jsx';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import RecentVisits from '../components/RecentVisits.jsx';
import { formatDate, formatMemberNumber } from '../utils/format.js';
import { LEVEL_DISPLAY } from '../utils/levels.js';
import PageTitle from '../components/ui/PageTitle.jsx';

const ROLE_DISPLAY = {
  ADMIN: { label: 'Admin', chip: 'bg-violet-100 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300' },
  TRAINER: { label: 'Trainer', chip: 'bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300' },
  MEMBER: { label: 'Member', chip: 'bg-brand-100 dark:bg-brand-500/15 text-brand-800 dark:text-brand-300' },
};

// Data loaders for useApiData (defined once, outside the components, so they stay the same).
const loadMemberCounts = () => listUsers({ role: 'MEMBER' });
const noData = () => Promise.resolve(null);

// ---------- shared parts ----------

function ProfileHeader({ user, levelName }) {
  const role = ROLE_DISPLAY[user.role];
  const level = levelName ? LEVEL_DISPLAY[levelName] : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-emerald-900 sm:h-40">
        <div aria-hidden="true" className="absolute -top-16 -right-10 size-64 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute -bottom-24 left-1/4 size-56 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute top-6 left-10 size-16 rounded-full bg-white/10" />
      </div>
      <div className="px-6 pb-6">
        <div className="flex flex-wrap items-end gap-4">
          <span className="-mt-12 rounded-full ring-4 ring-surface sm:-mt-14">
            <Avatar firstName={user.firstName} lastName={user.lastName} size="xl" />
          </span>
          <div className="min-w-0 pt-2">
            <PageTitle>Profile</PageTitle>
            <h1 className="truncate font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {user.firstName} {user.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${role.chip}`}>{role.label}</span>
              {level && (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${level.chip}`}>
                  <level.icon className="size-3.5" aria-hidden="true" />
                  {levelName}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-3 py-1 font-mono text-xs font-semibold text-ink-2">
                <Hash className="size-3.5" aria-hidden="true" />
                {formatMemberNumber(user.id)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountDetails({ user }) {
  const rows = [
    { icon: Hash, tone: 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300', label: 'Member number', value: formatMemberNumber(user.id), mono: true },
    { icon: Mail, tone: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300', label: 'Email', value: user.email },
    { icon: ShieldCheck, tone: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300', label: 'Role', value: ROLE_DISPLAY[user.role].label },
    { icon: CalendarDays, tone: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Member since', value: formatDate(user.createdAt) },
  ];
  return (
    <Card title="Account details">
      <ul className="space-y-4">
        {rows.map(({ icon: Icon, tone, label, value, mono }) => (
          <li key={label} className="flex items-center gap-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-faint">{label}</span>
              <span className={`block truncate font-medium text-ink ${mono ? 'font-mono' : ''}`}>{value}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------- members ----------

function MemberProfile({ user }) {
  const { data: visits } = useApiData(getMyVisits);
  const { data: bookings } = useApiData(listMyBookings);

  return (
    <div className="space-y-6">
      <ProfileHeader user={user} levelName={visits?.level} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Visits" value={visits?.visits} icon={Footprints} tone="brand" />
        <StatCard label="Points" value={visits?.points} icon={Trophy} tone="amber" />
        <StatCard label="Level" value={visits?.level} icon={visits ? LEVEL_DISPLAY[visits.level].icon : Trophy} tone="slate" />
        <StatCard label="Booked classes" value={bookings?.classes.length} icon={CalendarCheck} tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <LevelCard visits={visits} />
            <MyMembershipCard />
          </div>
          <RecentVisits visits={visits} />
        </div>

        <div className="space-y-6">
          <Card
            title="My QR code"
            actions={
              <Link to="/my-qr" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300">
                <Maximize2 className="size-4" aria-hidden="true" />
                Full screen
              </Link>
            }
          >
            <MemberQrCode size="small" />
          </Card>
          <AccountDetails user={user} />
        </div>
      </div>
    </div>
  );
}

// ---------- staff (admins and trainers) ----------

function StaffProfile({ user }) {
  const isAdmin = user.role === 'ADMIN';
  const { data: members } = useApiData(isAdmin ? loadMemberCounts : noData);
  const { data: today } = useApiData(listTodaysCheckIns);
  const { data: schedule } = useApiData(listClasses);

  const upcoming = schedule?.classes.filter((c) => !c.isCancelled) ?? null;
  const mine = upcoming?.filter((c) => c.trainer.id === user.id) ?? null;

  const stats = isAdmin
    ? [
        { label: 'Members', value: members?.counts.all, icon: Users, tone: 'brand' },
        { label: 'Active memberships', value: members?.counts.active, icon: CreditCard, tone: 'blue' },
        { label: 'Check-ins today', value: today?.count, icon: UserCheck, tone: 'amber' },
        { label: 'Classes (14 days)', value: upcoming?.length, icon: CalendarDays, tone: 'slate' },
      ]
    : [
        { label: 'My classes (14 days)', value: mine?.length, icon: CalendarDays, tone: 'brand' },
        { label: 'Members booked', value: mine?.reduce((sum, c) => sum + c.bookedCount, 0), icon: Users, tone: 'blue' },
        { label: 'Check-ins today', value: today?.count, icon: UserCheck, tone: 'amber' },
        { label: 'Gym classes (14 days)', value: upcoming?.length, icon: CalendarCheck, tone: 'slate' },
      ];

  const shortcuts = [
    { to: '/check-in', label: 'Check members in', icon: ScanLine },
    { to: '/classes', label: isAdmin ? 'Class schedule' : 'My classes', icon: CalendarDays },
    ...(isAdmin ? [{ to: '/people', label: 'People', icon: Users }, { to: '/plans', label: 'Plans', icon: CreditCard }] : []),
  ];

  return (
    <div className="space-y-6">
      <ProfileHeader user={user} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AccountDetails user={user} />
        </div>
        <Card title="Shortcuts">
          <div className="grid gap-2">
            {shortcuts.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink-2 transition hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-800 dark:hover:text-brand-300"
              >
                <Icon className="size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// "My profile" for every logged-in user: members see their level, QR code and visits,
// staff see the key numbers of the gym.
function ProfilePage() {
  const { user } = useAuth();
  return user.role === 'MEMBER' ? <MemberProfile user={user} /> : <StaffProfile user={user} />;
}

export default ProfilePage;
