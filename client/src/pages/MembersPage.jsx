import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { createUser, listUsers } from '../api/users.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import MembershipStatusBadge from '../components/MembershipStatusBadge.jsx';
import MembershipSummary from '../components/MembershipSummary.jsx';
import UserForm from '../components/UserForm.jsx';
import { formatDate } from '../utils/format.js';

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">People</h1>
          <p className="text-slate-600">Gym members and trainers.</p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Add person
          </button>
        )}
      </div>

      {isCreating && (
        <section className="rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">New account</h2>
          <UserForm initialRole={role} onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg bg-white p-1 shadow-sm" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.role}
              type="button"
              role="tab"
              aria-selected={role === tab.role}
              onClick={() => handleTabChange(tab.role)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                role === tab.role ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search name or email…"
          aria-label="Search name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-xs"
        />
      </div>

      {isMemberTab && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by membership status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => handleStatusChange(filter.value)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm font-medium ${
                status === filter.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {filter.label}
              {counts && <span className="ml-1.5 opacity-70">{counts[filter.countKey]}</span>}
            </button>
          ))}
        </div>
      )}

      <ErrorMessage>{error}</ErrorMessage>

      <section className="rounded-2xl bg-white shadow-md">
        {users === null && !error && <p className="p-5 text-slate-500">Loading…</p>}

        {users?.length === 0 && (
          <p className="p-5 text-slate-500">
            {search || status ? 'Nobody matches these filters.' : `No ${isMemberTab ? 'members' : 'trainers'} yet.`}
          </p>
        )}

        <ul className="divide-y divide-slate-100">
          {users?.map((user) => (
            <li key={user.id}>
              <Link
                to={`/people/${user.id}`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 p-4 hover:bg-slate-50 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                </div>

                {user.membership ? (
                  // Phones: always below the name. Wider screens: on the right.
                  <div className="flex w-full flex-col items-start gap-1 sm:w-auto sm:items-end">
                    <MembershipStatusBadge status={user.membership.status} />
                    <p className="text-sm text-slate-500">
                      <MembershipSummary membership={user.membership} />
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Joined {formatDate(user.createdAt)}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default MembersPage;
