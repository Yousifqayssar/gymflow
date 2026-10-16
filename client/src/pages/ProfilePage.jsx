import { CalendarDays, Hash, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import Avatar from '../components/ui/Avatar.jsx';
import Card from '../components/ui/Card.jsx';
import MyMembershipCard from '../components/MyMembershipCard.jsx';
import PointsCard from '../components/PointsCard.jsx';
import { formatDate, formatMemberNumber } from '../utils/format.js';

const ROLE_LABELS = { ADMIN: 'Admin', TRAINER: 'Trainer', MEMBER: 'Member' };

// One line of profile information: icon, label and value.
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="w-32 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-900">{children}</span>
    </div>
  );
}

// "My profile" for every logged-in user. Members also see their membership and points.
function ProfilePage() {
  const { user } = useAuth();
  const isMember = user.role === 'MEMBER';

  return (
    <div className="space-y-6">
      {/* Header: green banner with the avatar overlapping it */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-brand-500 to-brand-700 sm:h-32" />
        <div className="px-6 pb-6">
          {/* Only the avatar is pulled up over the banner; the name stays below it. */}
          <div className="flex flex-wrap items-start gap-4">
            <span className="-mt-10 rounded-full ring-4 ring-white">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="xl" />
            </span>
            <div className="pt-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-slate-500">
                {ROLE_LABELS[user.role]} · {formatMemberNumber(user.id)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className={`grid gap-6 ${isMember ? 'lg:grid-cols-2' : ''}`}>
        <Card title="Account">
          <div className="-my-3 divide-y divide-slate-100">
            <InfoRow icon={Hash} label="Member number">
              {formatMemberNumber(user.id)}
            </InfoRow>
            <InfoRow icon={Mail} label="Email">
              {user.email}
            </InfoRow>
            <InfoRow icon={ShieldCheck} label="Role">
              {ROLE_LABELS[user.role]}
            </InfoRow>
            <InfoRow icon={CalendarDays} label="Member since">
              {formatDate(user.createdAt)}
            </InfoRow>
          </div>
        </Card>

        {isMember && <PointsCard points={0} />}
      </div>

      {isMember && <MyMembershipCard />}
    </div>
  );
}

export default ProfilePage;
