import { useAuth } from '../auth/useAuth.js';
import SystemStatus from '../components/SystemStatus.jsx';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  MEMBER: 'Member',
};

// First page after login. Each role gets its own dashboard in later stages.
function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-slate-900">GymFlow</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4">
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
      </main>
    </div>
  );
}

export default HomePage;
