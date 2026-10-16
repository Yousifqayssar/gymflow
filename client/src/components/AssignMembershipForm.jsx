import { useEffect, useState } from 'react';
import { assignMembership, previewMembership } from '../api/members.js';
import ErrorMessage from './ErrorMessage.jsx';
import { formatDate, formatPrice } from '../utils/format.js';

// Form to sell a plan to a member. While the admin chooses a plan and start date,
// the server calculates the dates (the same code that saves), shown as a preview.
function AssignMembershipForm({ memberId, plans, onAssigned }) {
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(''); // empty = automatic (today or after the current one)
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ask the server for a preview whenever the plan or start date changes.
  useEffect(() => {
    if (!planId) return;

    let ignore = false;
    previewMembership(memberId, { planId, startDate })
      .then((data) => {
        if (!ignore) {
          setPreview(data.preview);
          setPreviewError('');
        }
      })
      .catch((err) => {
        if (!ignore) {
          setPreview(null);
          setPreviewError(err.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [memberId, planId, startDate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await assignMembership(memberId, { planId: Number(planId), startDate });
      setPlanId('');
      setStartDate('');
      setPreview(null);
      onAssigned();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (plans.length === 0) {
    return <p className="text-slate-500">There are no active plans. Create one on the Plans page first.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage>{submitError}</ErrorMessage>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="planId" className="mb-1 block text-sm font-medium text-slate-700">
            Plan
          </label>
          <select
            id="planId"
            required
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Choose a plan…</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} – {formatPrice(plan.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-slate-700">
            Start date <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          <p className="mt-1 text-xs text-slate-500">Empty = today, or right after the current membership.</p>
        </div>
      </div>

      {planId && preview && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Valid from <strong>{formatDate(preview.startDate)}</strong> to <strong>{formatDate(preview.endDate)}</strong> ·{' '}
          {formatPrice(preview.price)}
        </div>
      )}
      {planId && previewError && <ErrorMessage>{previewError}</ErrorMessage>}

      <button
        type="submit"
        disabled={isSubmitting || !preview || Boolean(previewError)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {isSubmitting ? 'Assigning…' : 'Assign membership'}
      </button>
    </form>
  );
}

export default AssignMembershipForm;
