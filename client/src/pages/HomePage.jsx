import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, QrCode, ScanLine, Users } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { useApiData } from '../hooks/useApiData.js';
import { getMyVisits } from '../api/me.js';
import { getGymStats } from '../api/gym.js';
import { listTodaysCheckIns } from '../api/checkIns.js';
import AdminHome from '../components/AdminHome.jsx';
import LevelCard from '../components/LevelCard.jsx';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import MyNextClasses from '../components/classes/MyNextClasses.jsx';
import TodaysCheckIns from '../components/checkIn/TodaysCheckIns.jsx';
import AboutSection from '../components/home/AboutSection.jsx';
import TrainersSection from '../components/home/TrainersSection.jsx';
import PartnerGymsSection from '../components/home/PartnerGymsSection.jsx';
import WelcomeHero from '../components/home/WelcomeHero.jsx';
import BodyReminder from '../components/body/BodyReminder.jsx';
import PageTitle from '../components/ui/PageTitle.jsx';

// "Open now" in the banner is refreshed this often.
const CLOCK_TICK_MS = 60_000;

// What the banner says and offers for each role.
const HERO = {
  MEMBER: {
    title: (user) => `Welcome back, ${user.firstName}!`,
    actions: [
      { to: '/my-qr', label: 'Show my QR code', icon: QrCode, primary: true },
      { to: '/classes', label: 'Book a class', icon: CalendarDays },
    ],
  },
  TRAINER: {
    title: (user) => `Welcome back, coach ${user.firstName}`,
    actions: [
      { to: '/check-in', label: 'Check members in', icon: ScanLine, primary: true },
      { to: '/classes', label: 'Class schedule', icon: CalendarDays },
    ],
  },
  ADMIN: {
    title: (user) => `Welcome back, ${user.firstName}`,
    actions: [
      { to: '/check-in', label: 'Check members in', icon: ScanLine, primary: true },
      { to: '/people', label: 'People', icon: Users },
    ],
  },
};

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

// Members: membership card, next classes, loyalty level.
function MemberDashboard() {
  const { data: visits } = useApiData(getMyVisits);

  return (
    <section>
      <BodyReminder />
      <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">Your training</h2>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <MyMembershipCard />
          <MyNextClasses />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <LevelCard visits={visits} />
          <LinkRow to="/profile">View my profile and visits</LinkRow>
        </div>
      </div>
    </section>
  );
}

// Trainers: who came in today.
function TrainerDashboard() {
  const { data: today, error } = useApiData(listTodaysCheckIns);

  return (
    <section>
      <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">Today at the gym</h2>
      <TodaysCheckIns today={today} error={error} limit={8} />
    </section>
  );
}

const DASHBOARDS = { ADMIN: AdminHome, TRAINER: TrainerDashboard, MEMBER: MemberDashboard };

// First page after login: a welcome banner with live gym numbers, the dashboard of the role,
// the trainers and "About us" (the footer with contact and social media comes from AppLayout).
function HomePage() {
  const { user } = useAuth();
  const { data: stats } = useApiData(getGymStats);
  const [now, setNow] = useState(() => new Date());
  const hero = HERO[user.role];
  const Dashboard = DASHBOARDS[user.role];

  // A clock for "Open now"; components must not read the clock while rendering.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <PageTitle>Home</PageTitle>
      <WelcomeHero title={hero.title(user)} stats={stats} actions={hero.actions} now={now} />
      <Dashboard />
      <TrainersSection />
      <PartnerGymsSection now={now} />
      <AboutSection now={now} />
    </div>
  );
}

export default HomePage;
