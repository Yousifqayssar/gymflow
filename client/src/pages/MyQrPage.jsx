import { useAuth } from '../auth/useAuth.js';
import MemberQrCode from '../components/MemberQrCode.jsx';

// "My QR code": the member shows this screen at the entrance to check in.
function MyQrPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-md">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="bg-gradient-to-br from-brand-500 to-brand-800 px-6 py-6 text-center text-white">
          <p className="text-sm font-medium text-white/80">Check in at the entrance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
        </div>
        <div className="px-6 py-8">
          <MemberQrCode size="large" />
        </div>
      </section>
      <p className="mt-4 text-center text-sm text-slate-500">
        Staff scan this code with the gym’s check-in screen. Every visit earns you 10 points.
      </p>
    </div>
  );
}

export default MyQrPage;
