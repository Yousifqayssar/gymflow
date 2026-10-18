import { useState } from 'react';
import { Link } from 'react-router';
import { m } from 'motion/react';
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Footprints,
  Hash,
  Mail,
  Maximize2,
  Pencil,
  QrCode,
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
import AvatarPicker from '../components/AvatarPicker.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import LevelCard from '../components/LevelCard.jsx';
import MemberQrCode from '../components/MemberQrCode.jsx';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import RecentVisits from '../components/RecentVisits.jsx';
import TodaysCheckIns from '../components/checkIn/TodaysCheckIns.jsx';
import PageTitle from '../components/ui/PageTitle.jsx';
import { Stagger, StaggerItem, TiltCard } from '../components/ui/motion.jsx';
import { formatDate, formatMemberNumber } from '../utils/format.js';
import { LEVEL_DISPLAY } from '../utils/levels.js';
import { CATEGORY_DISPLAY, formatLongDay, formatTime } from '../utils/classDisplay.js';

// How each role looks on the profile: chip colours and the cover photo (photos we already have).
const ROLE_DISPLAY = {
  ADMIN: {
    label: 'Admin',
    chip: 'bg-violet-100 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300',
    cover: CATEGORY_DISPLAY.STRENGTH.photo,
    tagline: 'Running the gym',
  },
  TRAINER: {
    label: 'Trainer',
    chip: 'bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300',
    cover: CATEGORY_DISPLAY.HIIT.photo,
    tagline: 'Coaching the team',
  },
  MEMBER: {
    label: 'Member',
    chip: 'bg-brand-100 dark:bg-brand-500/15 text-brand-800 dark:text-brand-300',
    cover: CATEGORY_DISPLAY.RUNNING.photo,
    tagline: 'Training at GymFlow',
  },
};

// Data loaders for useApiData (defined once, outside the components, so they stay the same).
const loadMemberCounts = () => listUsers({ role: 'MEMBER' });
const noData = () => Promise.resolve(null);

// ---------- shared parts ----------

// The avatar inside a slowly turning colour ring ("motion-safe": it stands still for "reduce motion"),
// with a pencil button to choose another avatar.
function AvatarRing({ user, onEdit }) {
  return (
    <span className="relative inline-flex shrink-0 rounded-full p-1 shadow-xl">
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[conic-gradient(var(--color-brand-400),var(--color-amber-300),var(--color-brand-600),var(--color-sky-400),var(--color-brand-400))] motion-safe:animate-[spin_10s_linear_infinite]"
      />
      <span className="relative rounded-full bg-surface p-1">
        <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} size="2xl" />
      </span>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Change avatar"
        title="Change avatar"
        className="absolute right-1 bottom-1 flex size-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-surface transition hover:scale-110 hover:bg-brand-700 active:scale-95"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
}

// Big header: photo cover in the brand colours, avatar with ring, name, chips and the main action.
function ProfileHeader({ user, levelName, action }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const role = ROLE_DISPLAY[user.role];
  const level = levelName ? LEVEL_DISPLAY[levelName] : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <PageTitle>Profile</PageTitle>
      <AvatarPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
      <div className="relative isolate h-40 overflow-hidden sm:h-56">
        <img src={role.cover} alt="" className="absolute inset-0 -z-30 size-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-500/90 via-brand-700/80 to-slate-900/90" />
        {/* One slowly floating light, so the cover feels alive without being distracting */}
        <m.div
          aria-hidden="true"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 right-10 -z-10 size-72 rounded-full bg-white/15 blur-3xl"
        />
        <div className="absolute top-5 right-5 flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:top-6 sm:right-6">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {role.tagline}
        </div>
      </div>

      <div className="px-5 pb-6 sm:px-8">
        {/* Only the avatar reaches up into the cover; the name stays below it on the white card */}
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-end gap-4 sm:gap-6">
            <span className="-mt-16 sm:-mt-20">
              <AvatarRing user={user} onEdit={() => setIsPickerOpen(true)} />
            </span>
            <div className="min-w-0 pt-2 pb-1">
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
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
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-4" aria-hidden="true" />
                  {user.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Since {formatDate(user.createdAt)}
                </span>
              </p>
            </div>
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}

// Stat cards that tilt a little in 3D on hover and come in one after another.
function StatGrid({ stats }) {
  return (
    <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <StaggerItem key={stat.label}>
          <TiltCard maxTilt={8} className="h-full">
            <StatCard {...stat} />
          </TiltCard>
        </StaggerItem>
      ))}
    </Stagger>
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

// Colourful shortcut tiles, e.g. "Check members in".
function ShortcutTiles({ shortcuts }) {
  return (
    <Card title="Shortcuts">
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map(({ to, label, icon: Icon, gradient }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col gap-3 rounded-2xl border border-line p-4 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
          >
            <span className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="flex items-center justify-between gap-1 text-sm font-semibold text-ink">
              {label}
              <ArrowRight className="size-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ---------- members ----------

function MemberProfile({ user }) {
  const { data: visits } = useApiData(getMyVisits);
  const { data: bookings } = useApiData(listMyBookings);

  const stats = [
    { label: 'Visits', value: visits?.visits, icon: Footprints, tone: 'brand' },
    { label: 'Points', value: visits?.points, icon: Trophy, tone: 'amber' },
    { label: 'Level', value: visits?.level, icon: visits ? LEVEL_DISPLAY[visits.level].icon : Trophy, tone: 'slate' },
    { label: 'Booked classes', value: bookings?.classes.length, icon: CalendarCheck, tone: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <ProfileHeader
        user={user}
        levelName={visits?.level}
        action={
          <Button as={Link} to="/my-qr" icon={QrCode}>
            My QR code
          </Button>
        }
      />
      <StatGrid stats={stats} />

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
              <Link to="/my-qr" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
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

// A short list of upcoming classes with the class photo as a thumbnail
// (a trainer's own classes, or the next classes of the whole gym for admins).
function UpcomingClassList({ title, description, emptyText, classes }) {
  return (
    <Card title={title} description={description} padded={false}>
      {!classes && <div className="m-5 h-32 animate-pulse rounded-xl bg-surface-3" />}
      {classes?.length === 0 && (
        <EmptyState icon={CalendarDays} title="No classes planned" description={emptyText} />
      )}
      <ul className="divide-y divide-line-soft">
        {classes?.slice(0, 6).map((gymClass) => (
          <li key={gymClass.id}>
            <Link to={`/classes/${gymClass.id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-2">
              <img src={CATEGORY_DISPLAY[gymClass.category].photo} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{gymClass.title}</span>
                <span className="block truncate text-sm text-muted">
                  {formatLongDay(gymClass.startsAt)} · {formatTime(gymClass.startsAt)}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-semibold text-ink-2">
                {gymClass.bookedCount}/{gymClass.capacity}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StaffProfile({ user }) {
  const isAdmin = user.role === 'ADMIN';
  const { data: members } = useApiData(isAdmin ? loadMemberCounts : noData);
  const { data: today, error: todayError } = useApiData(listTodaysCheckIns);
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
    { to: '/check-in', label: 'Check-in', icon: ScanLine, gradient: 'from-brand-400 to-brand-700' },
    { to: '/classes', label: isAdmin ? 'Classes' : 'Schedule', icon: CalendarDays, gradient: 'from-violet-400 to-fuchsia-600' },
    ...(isAdmin
      ? [
          { to: '/people', label: 'People', icon: Users, gradient: 'from-sky-400 to-blue-600' },
          { to: '/plans', label: 'Plans', icon: CreditCard, gradient: 'from-amber-400 to-orange-600' },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <ProfileHeader
        user={user}
        action={
          <Button as={Link} to="/check-in" icon={ScanLine}>
            Check members in
          </Button>
        }
      />
      <StatGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isAdmin ? (
            <div className="space-y-6">
              <TodaysCheckIns today={today} error={todayError} limit={6} />
              <UpcomingClassList
                title="Coming up at the gym"
                description="The next classes on the schedule."
                emptyText="New classes appear here."
                classes={upcoming}
              />
            </div>
          ) : (
            <UpcomingClassList
              title="My upcoming classes"
              description="The classes you teach in the next two weeks."
              emptyText="Classes you are the trainer of appear here."
              classes={mine}
            />
          )}
        </div>
        <div className="space-y-6">
          <ShortcutTiles shortcuts={shortcuts} />
          <AccountDetails user={user} />
        </div>
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
