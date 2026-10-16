import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CircleCheck, CreditCard, TriangleAlert, UserPlus, UserRound, UserX, Users } from 'lucide-react';
import { listUsers } from '../api/users.js';
import Avatar from './ui/Avatar.jsx';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import EmptyState from './ui/EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import PageHeader from './ui/PageHeader.jsx';
import StatCard from './ui/StatCard.jsx';
import SystemStatus from './SystemStatus.jsx';
import { formatDate } from '../utils/format.js';

// Admin home: key numbers, members who need to renew, quick actions.
// One request gives everything: the expiring members (sorted by urgency) and the counts per status.
function AdminHome({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { users, counts }
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    listUsers({ status: 'expiring' })
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const counts = data?.counts;
  const stats = [
    { label: 'Active members', value: counts?.active, icon: Users, tone: 'brand', filter: 'active' },
    { label: 'Expiring soon', value: counts?.expiring, icon: TriangleAlert, tone: 'amber', filter: 'expiring' },
    { label: 'Expired', value: counts?.expired, icon: UserX, tone: 'red', filter: 'expired' },
    { label: 'No membership', value: counts?.none, icon: UserRound, tone: 'slate', filter: 'none' },
  ];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.firstName}`} description="Here is what is happening at your gym today." />

      <ErrorMessage>{error}</ErrorMessage>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.filter}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
            onClick={() => navigate(`/people?status=${stat.filter}`)}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          padded={false}
          title="Needs renewal"
          description="Memberships ending within the next 7 days."
          actions={
            <Link to="/people?status=expiring" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              View all
            </Link>
          }
        >
          {data?.users.length === 0 && (
            <EmptyState icon={CircleCheck} title="Nobody needs to renew this week" description="All memberships are fine for the next 7 days." />
          )}
          <ul className="divide-y divide-slate-100">
            {data?.users.slice(0, 5).map((member) => (
              <li key={member.id}>
                <Link to={`/people/${member.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <Avatar firstName={member.firstName} lastName={member.lastName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {member.membership.planName} · ends {formatDate(member.membership.endDate)}
                    </p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {member.membership.daysRemaining} {member.membership.daysRemaining === 1 ? 'day' : 'days'} left
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card title="Quick actions">
            <div className="grid gap-2">
              <Button as={Link} to="/people" icon={UserPlus} variant="secondary" className="justify-start">
                Add or find a person
              </Button>
              <Button as={Link} to="/plans" icon={CreditCard} variant="secondary" className="justify-start">
                Manage plans
              </Button>
            </div>
          </Card>
          <SystemStatus />
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
