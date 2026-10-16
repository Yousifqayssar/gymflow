import { useEffect, useState } from 'react';
import { createUser, listUsers } from '../api/users.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import UserForm from '../components/UserForm.jsx';
import { formatDate } from '../utils/format.js';

const TABS = [
  { role: 'MEMBER', label: 'Members' },
  { role: 'TRAINER', label: 'Trainers' },
];

// Wait this long after the last key press before searching, so we don't send a request per letter.
const SEARCH_DELAY_MS = 300;

// Admin page: list members or trainers, search them, and create new accounts.
function MembersPage() {
  const [role, setRole] = useState('MEMBER');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [reloadCount, setReloadCount] = useState(0); // increase to load the list again

  // Load the list whenever the tab, the search text or reloadCount changes.
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      listUsers({ role, search: search.trim() })
        .then((data) => {
          if (!ignore) {
            setUsers(data.users);
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
  }, [role, search, reloadCount]);

  function handleTabChange(newRole) {
    setRole(newRole);
    setUsers(null);
  }

  async function handleCreate(newUser) {
    await createUser(newUser); // errors are shown inside the form
    setIsCreating(false);
    // Show the tab of the new account, then reload the list.
    setRole(newUser.role);
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

      <ErrorMessage>{error}</ErrorMessage>

      <section className="rounded-2xl bg-white shadow-md">
        {users === null && !error && <p className="p-5 text-slate-500">Loading…</p>}

        {users?.length === 0 && (
          <p className="p-5 text-slate-500">
            {search ? 'Nobody matches your search.' : `No ${role === 'MEMBER' ? 'members' : 'trainers'} yet.`}
          </p>
        )}

        <ul className="divide-y divide-slate-100">
          {users?.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-4 sm:px-5">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
              <p className="text-sm text-slate-500">Joined {formatDate(user.createdAt)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default MembersPage;
