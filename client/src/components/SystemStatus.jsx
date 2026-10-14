import { useEffect, useState } from 'react';
import { fetchHealth } from '../api/health.js';

// One line of the status card, e.g. "API  ✓ Online".
function StatusRow({ label, isUp }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-medium text-slate-700">{label}</span>
      <span className={isUp ? 'text-green-600' : 'text-red-600'}>
        {isUp ? '✓ Online' : '✗ Offline'}
      </span>
    </div>
  );
}

// Shows whether the API and the database are reachable.
function SystemStatus() {
  // null means "still checking".
  const [health, setHealth] = useState(null);

  // Run the check once, when the component first appears on the page.
  useEffect(() => {
    // If the component disappears before the answer arrives,
    // we ignore the answer instead of updating a component that no longer exists.
    let ignore = false;
    fetchHealth().then((result) => {
      if (!ignore) setHealth(result);
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleCheckAgain() {
    setHealth(null);
    setHealth(await fetchHealth());
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 p-4 text-left">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        System status
      </h2>

      {health === null ? (
        <p className="py-2 text-slate-500">Checking…</p>
      ) : (
        <div className="divide-y divide-slate-100">
          <StatusRow label="API" isUp={health.api} />
          <StatusRow label="Database" isUp={health.database} />
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckAgain}
        className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
      >
        Check again
      </button>
    </section>
  );
}

export default SystemStatus;
