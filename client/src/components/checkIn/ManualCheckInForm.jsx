import { useState } from 'react';
import { LogIn } from 'lucide-react';
import Button from '../ui/Button.jsx';

// Check-in without the camera: staff type the member number from the member's profile, e.g. GF-00004.
function ManualCheckInForm({ onCode, isBusy }) {
  const [memberNumber, setMemberNumber] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const code = memberNumber.trim();
    if (!code) return;
    const isDone = await onCode(code);
    if (isDone) setMemberNumber('');
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-sm">
      {/* "or" divider between the camera and the form */}
      <div className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or type the member number
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <label htmlFor="memberNumber" className="sr-only">
        Member number
      </label>
      <div className="flex gap-2">
        <input
          id="memberNumber"
          name="memberNumber"
          value={memberNumber}
          onChange={(event) => setMemberNumber(event.target.value)}
          placeholder="GF-00004"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono uppercase text-slate-900 shadow-sm outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <Button type="submit" icon={LogIn} disabled={isBusy || !memberNumber.trim()}>
          Check in
        </Button>
      </div>
    </form>
  );
}

export default ManualCheckInForm;
