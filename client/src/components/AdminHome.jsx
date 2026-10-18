import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, CircleCheck, CreditCard, ScanLine, TriangleAlert, UserPlus, UserRound, UserX, Users } from 'lucide-react';
import { listTodaysCheckIns } from '../api/checkIns.js';
import { listUsers } from '../api/users.js';
import { useApiData } from '../hooks/useApiData.js';
import TodaysCheckIns from './checkIn/TodaysCheckIns.jsx';
import Avatar from './ui/Avatar.jsx';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import EmptyState from './ui/EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import StatCard from './ui/StatCard.jsx';
import SystemStatus from './SystemStatus.jsx';
import { formatDate } from '../utils/format.js';
import { Stagger, StaggerItem } from './ui/motion.jsx';

// Admin home: key numbers, members who need to renew, today's visits, quick actions.
// One request gives everything: the expiring members (sorted by urgency) and the counts per status.
function AdminHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { users, counts }
  const [error, setError] = useState('');
  const { data: today, error: todayError } = useApiData(listTodaysCheckIns);

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
      <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">Today at the gym</h2>

      <ErrorMessage>{error}</ErrorMessage>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.filter}>
            <StatCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone}
              onClick={() => navigate(`/people?status=${stat.filter}`)}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            padded={false}
            title="Needs renewal"
            description="Memberships ending within the next 7 days."
            actions={
              <Link to="/people?status=expiring" className="text-sm font-medium text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300">
                View all
              </Link>
            }
          >
            {data?.users.length === 0 && (
              <EmptyState icon={CircleCheck} title="Nobody needs to renew this week" description="All memberships are fine for the next 7 days." />
            )}
            <ul className="divide-y divide-line-soft">
              {data?.users.slice(0, 5).map((member) => (
                <li key={member.id}>
                  <Link to={`/people/${member.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                    <Avatar firstName={member.firstName} lastName={member.lastName} avatar={member.avatar} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {member.membership.planName} · ends {formatDate(member.membership.endDate)}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-amber-100 dark:bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      {member.membership.daysRemaining} {member.membership.daysRemaining === 1 ? 'day' : 'days'} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <TodaysCheckIns
            today={today}
            error={todayError}
            limit={5}
            actions={
              <Link to="/check-in" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                Open check-in
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />
        </div>

        <div className="space-y-6">
          <Card title="Quick actions">
            <div className="grid gap-2">
              <Button as={Link} to="/check-in" icon={ScanLine} className="justify-start">
                Check in a member
              </Button>
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
