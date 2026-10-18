import { useState } from 'react';
import { saveMyBody } from '../../api/body.js';
import { GOALS } from '../../utils/body.js';
import { toFieldErrors } from '../../utils/fieldErrors.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import FormField from '../FormField.jsx';
import { useToast } from '../ui/useToast.js';

// Text field values → numbers for the API ("" stays empty, "72,5" also works).
const toNumber = (text) => (text.trim() === '' ? null : Number(text.replace(',', '.')));

// The monthly check-in form: height, weight, goal and an optional target weight.
// Starts with the last values, so a member usually only has to change the weight.
function BodyForm({ isOpen, onClose, latest, onSaved }) {
  const showToast = useToast();
  const [values, setValues] = useState(() => ({
    heightCm: latest ? String(latest.heightCm) : '',
    weightKg: latest ? String(latest.weightKg) : '',
    goal: latest?.goal ?? '',
    targetWeightKg: latest?.targetWeightKg ? String(latest.targetWeightKg) : '',
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setFieldErrors({});
    try {
      const overview = await saveMyBody({
        heightCm: toNumber(values.heightCm),
        weightKg: toNumber(values.weightKg),
        goal: values.goal || undefined,
        targetWeightKg: toNumber(values.targetWeightKg),
      });
      onSaved(overview);
      showToast('Your body check-in is saved');
      onClose();
    } catch (err) {
      setFieldErrors(toFieldErrors(err.details));
      setError(err.details?.length ? '' : err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title="Monthly body check-in" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <p className="text-sm text-muted">Update your numbers once a month – your trainer uses them to plan your workouts.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Height (cm)" name="heightCm" inputMode="decimal" placeholder="178" value={values.heightCm} onChange={handleChange} error={fieldErrors.heightCm} />
          <FormField label="Weight (kg)" name="weightKg" inputMode="decimal" placeholder="75.5" value={values.weightKg} onChange={handleChange} error={fieldErrors.weightKg} />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-2">My goal</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(GOALS).map(([value, { label, icon: Icon }]) => {
              const isSelected = values.goal === value;
              return (
                <label
                  key={value}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    isSelected ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300' : 'border-line text-ink-2 hover:bg-surface-2'
                  } has-focus-visible:outline-2 has-focus-visible:outline-brand-600`}
                >
                  <input type="radio" name="goal" value={value} checked={isSelected} onChange={handleChange} className="sr-only" />
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {label}
                </label>
              );
            })}
          </div>
          {fieldErrors.goal && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{fieldErrors.goal}</p>}
        </fieldset>

        <FormField
          label="Target weight (kg, optional)"
          name="targetWeightKg"
          inputMode="decimal"
          placeholder="70"
          value={values.targetWeightKg}
          onChange={handleChange}
          error={fieldErrors.targetWeightKg}
        />

        <ErrorMessage>{error}</ErrorMessage>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save check-in'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BodyForm;
