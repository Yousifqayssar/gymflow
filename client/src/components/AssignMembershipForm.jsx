import { useEffect, useState } from 'react';
import { assignMembership, previewMembership } from '../api/members.js';
import ErrorMessage from './ErrorMessage.jsx';
import { formatDate, formatPrice } from '../utils/format.js';
import Button from './ui/Button.jsx';

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

  const selectedPlan = plans.find((plan) => String(plan.id) === planId);

  if (plans.length === 0) {
    return <p className="text-muted">There are no active plans. Create one on the Plans page first.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage>{submitError}</ErrorMessage>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="planId" className="mb-1 block text-sm font-medium text-ink-2">
            Plan
          </label>
          <select
            id="planId"
            required
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/25"
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
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-ink-2">
            Start date <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-lg border border-line-strong px-3 py-2 text-ink outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/25"
          />
          <p className="mt-1 text-xs text-muted">Empty = today, or right after the current membership.</p>
        </div>
      </div>

      {/* What the chosen plan includes, so the admin can explain it to the member. */}
      {selectedPlan?.description && <p className="-mt-1 text-sm text-ink-3">{selectedPlan.description}</p>}

      {planId && preview && (
        <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">
          Valid from <strong>{formatDate(preview.startDate)}</strong> to <strong>{formatDate(preview.endDate)}</strong> ·{' '}
          {formatPrice(preview.price)}
        </div>
      )}
      {planId && previewError && <ErrorMessage>{previewError}</ErrorMessage>}

      <Button type="submit" disabled={isSubmitting || !preview || Boolean(previewError)}>
        {isSubmitting ? 'Assigning…' : 'Assign membership'}
      </Button>
    </form>
  );
}

export default AssignMembershipForm;
