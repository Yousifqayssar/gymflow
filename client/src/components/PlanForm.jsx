import { useState } from 'react';
import FormField from './FormField.jsx';
import TextAreaField from './TextAreaField.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { toFieldErrors } from '../utils/fieldErrors.js';

const EMPTY_PLAN = { name: '', description: '', durationMonths: '', price: '' };

// Form for creating or editing a membership plan.
// `onSubmit` receives { name, description, durationMonths, price } and may throw an ApiError.
function PlanForm({ initialPlan = EMPTY_PLAN, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initialPlan.name,
    description: initialPlan.description ?? '',
    durationMonths: String(initialPlan.durationMonths),
    price: String(initialPlan.price),
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Inputs always give text; the API expects numbers.
      await onSubmit({
        name: form.name,
        description: form.description,
        durationMonths: Number(form.durationMonths),
        price: Number(form.price),
      });
    } catch (err) {
      setError(err.message);
      setFieldErrors(toFieldErrors(err.details));
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage>{error}</ErrorMessage>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Plan name"
          name="name"
          required
          placeholder="e.g. 3 Months"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />
        <FormField
          label="Duration (months)"
          name="durationMonths"
          type="number"
          required
          min={1}
          max={60}
          step={1}
          value={form.durationMonths}
          onChange={handleChange}
          error={fieldErrors.durationMonths}
        />
        <FormField
          label="Price (₺)"
          name="price"
          type="number"
          required
          min={0.01}
          step={0.01}
          value={form.price}
          onChange={handleChange}
          error={fieldErrors.price}
        />
      </div>

      <TextAreaField
        label="What's included"
        name="description"
        placeholder="e.g. Unlimited gym access 7 days a week and all group classes."
        hint="Shown to the admin when selling the plan and to members."
        maxLength={500}
        value={form.description}
        onChange={handleChange}
        error={fieldErrors.description}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default PlanForm;
