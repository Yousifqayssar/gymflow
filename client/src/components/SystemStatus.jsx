import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchHealth } from '../api/health.js';
import Card from './ui/Card.jsx';

// One line of the status card, e.g. "API  ● Online".
function StatusRow({ label, isUp }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`flex items-center gap-2 text-sm font-medium ${isUp ? 'text-brand-700' : 'text-red-600'}`}>
        <span className={`size-2 rounded-full ${isUp ? 'bg-brand-500' : 'bg-red-500'}`} aria-hidden="true" />
        {isUp ? 'Online' : 'Offline'}
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
    <Card
      title="System status"
      actions={
        <button
          type="button"
          onClick={handleCheckAgain}
          aria-label="Check again"
          title="Check again"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <RefreshCw className="size-4" />
        </button>
      }
    >
      {health === null ? (
        <p className="py-2 text-sm text-slate-500">Checking…</p>
      ) : (
        <div className="-my-2 divide-y divide-slate-100">
          <StatusRow label="API" isUp={health.api} />
          <StatusRow label="Database" isUp={health.database} />
        </div>
      )}
    </Card>
  );
}

export default SystemStatus;
