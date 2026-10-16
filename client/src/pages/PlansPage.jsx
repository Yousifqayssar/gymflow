import { useEffect, useState } from 'react';
import { createPlan, listPlans, updatePlan } from '../api/plans.js';
import Badge from '../components/Badge.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PlanForm from '../components/PlanForm.jsx';
import { formatMonths, formatPrice } from '../utils/format.js';

// Admin page: list, create, edit and (de)activate membership plans.
function PlansPage() {
  const [plans, setPlans] = useState(null); // null = still loading
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Load the plans once when the page opens.
  useEffect(() => {
    let ignore = false;
    listPlans()
      .then((data) => {
        if (!ignore) setPlans(data.plans);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // After a change, reload the list so it shows exactly what the server stored (and in its order).
  async function reloadPlans() {
    const data = await listPlans();
    setPlans(data.plans);
  }

  async function handleCreate(plan) {
    await createPlan(plan); // errors are shown inside the form
    setIsCreating(false);
    await reloadPlans();
  }

  async function handleEdit(id, changes) {
    await updatePlan(id, changes);
    setEditingId(null);
    await reloadPlans();
  }

  async function handleToggleActive(plan) {
    setError('');
    try {
      await updatePlan(plan.id, { isActive: !plan.isActive });
      await reloadPlans();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Membership plans</h1>
          <p className="text-slate-600">What the gym sells. Inactive plans can no longer be assigned.</p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + New plan
          </button>
        )}
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      {isCreating && (
        <section className="rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">New plan</h2>
          <PlanForm submitLabel="Create plan" onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
        </section>
      )}

      <section className="rounded-2xl bg-white shadow-md">
        {plans === null && !error && <p className="p-5 text-slate-500">Loading plans…</p>}

        {plans?.length === 0 && (
          <p className="p-5 text-slate-500">No plans yet. Create the first one with “+ New plan”.</p>
        )}

        <ul className="divide-y divide-slate-100">
          {plans?.map((plan) => (
            <li key={plan.id} className="p-5">
              {editingId === plan.id ? (
                <PlanForm
                  initialPlan={plan}
                  submitLabel="Save changes"
                  onSubmit={(changes) => handleEdit(plan.id, changes)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                // Phones: name + price on one line, buttons below. Wider screens: all on one line.
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${plan.isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                        {plan.name}
                      </span>
                      <Badge tone={plan.isActive ? 'green' : 'gray'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{formatMonths(plan.durationMonths)}</p>
                  </div>

                  <span className="text-lg font-semibold text-slate-900">{formatPrice(plan.price)}</span>

                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setEditingId(plan.id)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default PlansPage;
