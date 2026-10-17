import { Link } from 'react-router';
import { ArrowRight, QrCode } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { useApiData } from '../hooks/useApiData.js';
import { getMyVisits } from '../api/me.js';
import AdminHome from '../components/AdminHome.jsx';
import LevelCard from '../components/LevelCard.jsx';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import MyNextClasses from '../components/classes/MyNextClasses.jsx';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

// Members: membership card, loyalty level, QR code shortcut and next classes.
function MemberHome({ user }) {
  const { data: visits } = useApiData(getMyVisits);

  return (
    <div>
      <PageHeader title={`Hi, ${user.firstName}!`} tabTitle="Home" description="Ready for your next workout?" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <MyMembershipCard />
          <MyNextClasses />
        </div>
        <div className="space-y-4 lg:col-span-2">
          {/* The most important action at the gym door: one tap to the QR code */}
          <Link
            to="/my-qr"
            className="group flex items-center gap-4 rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-md ring-1 ring-white/10 transition hover:bg-slate-800 dark:bg-brand-700 dark:hover:bg-brand-600"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-white/10">
              <QrCode className="size-6" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Show my QR code</span>
              <span className="block text-sm text-white/70">Check in at the entrance</span>
            </span>
            <ArrowRight className="size-5 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <LevelCard visits={visits} />
          <Link
            to="/profile"
            className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-medium text-ink-2 shadow-sm hover:bg-surface-2"
          >
            View my profile and visits
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Trainers: classes and workout plans are added in Stage 3.
function TrainerHome({ user }) {
  return (
    <div>
      <PageHeader title={`Welcome, ${user.firstName}`} tabTitle="Home" description="Good to have you on the team." />
      <Card title="Your trainer account">
        <p className="text-ink-3">
          You are logged in as a trainer. Your profile shows your account details and member number.
        </p>
      </Card>
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
