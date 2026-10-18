import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { createUser, listUsers } from '../api/users.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import MembershipStatusBadge from '../components/MembershipStatusBadge.jsx';
import MembershipSummary from '../components/MembershipSummary.jsx';
import UserForm from '../components/UserForm.jsx';
import { ChevronRight, Search, UserPlus, Users } from 'lucide-react';
import { formatDate, formatMemberNumber } from '../utils/format.js';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';

const TABS = [
  { role: 'MEMBER', label: 'Members' },
  { role: 'TRAINER', label: 'Trainers' },
];

// Membership filters for the Members tab ('' = all). "Active" includes "Expiring soon".
const STATUS_FILTERS = [
  { value: '', countKey: 'all', label: 'All' },
  { value: 'active', countKey: 'active', label: 'Active' },
  { value: 'expiring', countKey: 'expiring', label: 'Expiring soon' },
  { value: 'expired', countKey: 'expired', label: 'Expired' },
  { value: 'none', countKey: 'none', label: 'No membership' },
];

// Wait this long after the last key press before searching, so we don't send a request per letter.
const SEARCH_DELAY_MS = 300;

// Admin page: list members (with membership status) or trainers, search and filter them,
// and create new accounts.
function MembersPage() {
  // A filter can come from the URL, e.g. /people?status=expiring (used by the admin home page).
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status');
  const initialStatus = STATUS_FILTERS.some((f) => f.value === statusFromUrl) ? statusFromUrl : '';

  const [role, setRole] = useState('MEMBER');
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(null); // null = loading
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [reloadCount, setReloadCount] = useState(0); // increase to load the list again

  const isMemberTab = role === 'MEMBER';

  // Load the list whenever the tab, filter, search text or reloadCount changes.
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      listUsers({ role, status: role === 'MEMBER' ? status : '', search: search.trim() })
        .then((data) => {
          if (!ignore) {
            setUsers(data.users);
            setCounts(data.counts ?? null);
            setError('');
          }
        })
        .catch((err) => {
          if (!ignore) setError(err.message);
        });
    }, SEARCH_DELAY_MS);

    // Cleanup: cancel the pending search when the user keeps typing, and ignore late answers.
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [role, status, search, reloadCount]);

  function handleTabChange(newRole) {
    setRole(newRole);
    setStatus('');
    setUsers(null);
  }

  function handleStatusChange(newStatus) {
    setStatus(newStatus);
    setUsers(null);
  }

  async function handleCreate(newUser) {
    await createUser(newUser); // errors are shown inside the form
    setIsCreating(false);
    // Show the tab of the new account, then reload the list.
    setRole(newUser.role);
    setStatus('');
    setReloadCount((count) => count + 1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="People"
        description="Gym members and trainers."
        actions={
          !isCreating && (
            <Button icon={UserPlus} onClick={() => setIsCreating(true)}>
              Add person
            </Button>
          )
        }
      />

      {isCreating && (
        <Card title="New account" description="The person can log in straight away with this password.">
          <UserForm initialRole={role} onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-line bg-surface p-1 shadow-sm" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.role}
              type="button"
              role="tab"
              aria-selected={role === tab.role}
              onClick={() => handleTabChange(tab.role)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                role === tab.role ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-3 hover:bg-surface-3 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search name or email…"
            aria-label="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface py-2 pr-3 pl-9 text-ink shadow-sm outline-none transition placeholder:text-faint focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/25"
          />
        </div>
      </div>

      {isMemberTab && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by membership status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => handleStatusChange(filter.value)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === filter.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2'
              }`}
            >
              {filter.label}
              {counts && <span className="ml-1.5 opacity-70">{counts[filter.countKey]}</span>}
            </button>
          ))}
        </div>
      )}

      <ErrorMessage>{error}</ErrorMessage>

      <Card padded={false}>
        {users === null && !error && <ListSkeleton />}

        {users?.length === 0 && (
          <EmptyState
            icon={Users}
            title={search || status ? 'Nobody matches these filters' : `No ${isMemberTab ? 'members' : 'trainers'} yet`}
            description={search || status ? 'Try another name or filter.' : 'Add the first person with “Add person”.'}
          />
        )}

        <ul className="divide-y divide-line-soft">
          {users?.map((user) => (
            <li key={user.id}>
              <Link
                to={`/people/${user.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5"
              >
                <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-sm text-muted">
                    <span className="font-mono">{formatMemberNumber(user.id)}</span> · {user.email}
                  </p>
                </div>

                {user.membership ? (
                  // Phones: below the name. Wider screens: on the right.
                  <div className="flex w-full flex-col items-start gap-1 pl-14 sm:w-auto sm:items-end sm:pl-0">
                    <MembershipStatusBadge status={user.membership.status} />
                    <p className="text-sm text-muted">
                      <MembershipSummary membership={user.membership} />
                    </p>
                  </div>
                ) : (
                  <p className="w-full pl-14 text-sm text-muted sm:w-auto sm:pl-0">Joined {formatDate(user.createdAt)}</p>
                )}
                <ChevronRight className="hidden size-5 shrink-0 text-faint sm:block" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// Grey placeholder rows while the list loads, so the page does not jump when it arrives.
function ListSkeleton() {
  return (
    <ul className="divide-y divide-line-soft" aria-label="Loading">
      {[1, 2, 3, 4].map((n) => (
        <li key={n} className="flex animate-pulse items-center gap-4 px-5 py-4">
          <span className="size-10 rounded-full bg-surface-3" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-40 rounded bg-surface-3" />
            <span className="block h-3 w-56 rounded bg-surface-3" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default MembersPage;
