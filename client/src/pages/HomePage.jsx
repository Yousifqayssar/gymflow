import { useAuth } from '../auth/useAuth.js';
import SystemStatus from '../components/SystemStatus.jsx';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  MEMBER: 'Member',
};

// First page after login. Each role gets its own dashboard in later stages.
// The header and menu come from AppLayout.
function HomePage() {
  const { user } = useAuth();

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.firstName}!</h1>
      <p className="mt-2 text-slate-600">
        You are logged in as{' '}
        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-sm font-medium text-white">
          {ROLE_LABELS[user.role]}
        </span>
      </p>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>

      <SystemStatus />
    </div>
  );
}

export default HomePage;
