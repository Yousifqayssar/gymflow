import { useEffect, useState } from 'react';
import { createPlan, listPlans, updatePlan } from '../api/plans.js';
import Badge from '../components/Badge.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PlanForm from '../components/PlanForm.jsx';
import PlanTypeBadge from '../components/PlanTypeBadge.jsx';
import { formatMonths, formatPrice } from '../utils/format.js';
import { CreditCard, Eye, EyeOff, Pencil, Plus } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Stagger, StaggerItem } from '../components/ui/motion.jsx';

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
    <div className="space-y-5">
      <PageHeader
        title="Membership plans"
        tabTitle="Plans"
        description="What the gym sells. Inactive plans can no longer be assigned."
        actions={
          !isCreating && (
            <Button icon={Plus} onClick={() => setIsCreating(true)}>
              New plan
            </Button>
          )
        }
      />

      <ErrorMessage>{error}</ErrorMessage>

      {isCreating && (
        <Card title="New plan">
          <PlanForm submitLabel="Create plan" onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
        </Card>
      )}

      {plans === null && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 animate-pulse rounded-2xl bg-surface-3" />
          ))}
        </div>
      )}

      {plans?.length === 0 && (
        <Card>
          <EmptyState icon={CreditCard} title="No plans yet" description="Create the first one with “New plan”." />
        </Card>
      )}

      {plans && (
      <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <StaggerItem
            as="li"
            key={plan.id}
            className={`flex flex-col rounded-2xl border bg-surface p-5 shadow-sm ${
              editingId === plan.id
                ? 'border-brand-500 ring-2 ring-brand-100 sm:col-span-2 lg:col-span-3 dark:ring-brand-500/25'
                : 'border-line'
            } ${plan.isActive ? '' : 'opacity-70'}`}
          >
            {editingId === plan.id ? (
              <PlanForm
                initialPlan={plan}
                submitLabel="Save changes"
                onSubmit={(changes) => handleEdit(plan.id, changes)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-ink">{plan.name}</h2>
                    <p className="text-sm text-muted">{formatMonths(plan.durationMonths)}</p>
                  </div>
                  <Badge tone={plan.isActive ? 'green' : 'gray'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>

                <div className="mt-3">
                  <PlanTypeBadge classesPerMonth={plan.classesPerMonth} />
                </div>
                <p className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">{formatPrice(plan.price)}</p>
                {plan.description && <p className="mt-2 text-sm text-ink-3">{plan.description}</p>}

                <div className="mt-auto flex gap-2 pt-5">
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditingId(plan.id)}>
                    Edit
                  </Button>
                  <Button
                    variant={plan.isActive ? 'danger' : 'secondary'}
                    size="sm"
                    icon={plan.isActive ? EyeOff : Eye}
                    onClick={() => handleToggleActive(plan)}
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </>
            )}
          </StaggerItem>
        ))}
      </Stagger>
      )}
    </div>
  );
}

export default PlansPage;
