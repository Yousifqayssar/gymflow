import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import AdminHome from '../components/AdminHome.jsx';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import MyNextClasses from '../components/classes/MyNextClasses.jsx';
import PointsCard from '../components/PointsCard.jsx';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

// Members: their membership card and points.
function MemberHome({ user }) {
  return (
    <div>
      <PageHeader title={`Hi, ${user.firstName}!`} description="Ready for your next workout?" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <MyMembershipCard />
          <MyNextClasses />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <PointsCard points={0} />
          <Link
            to="/profile"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            View my profile
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
      <PageHeader title={`Welcome, ${user.firstName}`} description="Good to have you on the team." />
      <Card title="Your trainer account">
        <p className="text-slate-600">
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
