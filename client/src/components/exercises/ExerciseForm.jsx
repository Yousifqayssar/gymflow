import { useState } from 'react';
import FormField from '../FormField.jsx';
import SelectField from '../SelectField.jsx';
import TextAreaField from '../TextAreaField.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import Button from '../ui/Button.jsx';
import { toFieldErrors } from '../../utils/fieldErrors.js';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';

const MUSCLE_OPTIONS = Object.entries(MUSCLE_GROUPS).map(([value, { label }]) => [value, label]);
const EQUIPMENT_OPTIONS = Object.entries(EQUIPMENT_LABELS);

// Add or edit an exercise of the library.
function ExerciseForm({ initialExercise, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: initialExercise?.name ?? '',
    muscleGroup: initialExercise?.muscleGroup ?? '',
    equipment: initialExercise?.equipment ?? '',
    description: initialExercise?.description ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setFieldErrors({});
    try {
      await onSubmit({
        ...values,
        muscleGroup: values.muscleGroup || undefined,
        equipment: values.equipment || undefined,
        isActive: initialExercise?.isActive ?? true,
      });
    } catch (err) {
      setFieldErrors(toFieldErrors(err.details));
      setError(err.details?.length ? '' : err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label="Name" name="name" placeholder="Back squat" value={values.name} onChange={handleChange} error={fieldErrors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Muscle group" name="muscleGroup" placeholder="Choose…" options={MUSCLE_OPTIONS} value={values.muscleGroup} onChange={handleChange} error={fieldErrors.muscleGroup} />
        <SelectField label="Equipment" name="equipment" placeholder="Choose…" options={EQUIPMENT_OPTIONS} value={values.equipment} onChange={handleChange} error={fieldErrors.equipment} />
      </div>
      <TextAreaField
        label="How to do it"
        name="description"
        rows={4}
        maxLength={600}
        placeholder="Short, clear steps a member can follow."
        value={values.description}
        onChange={handleChange}
        error={fieldErrors.description}
      />
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default ExerciseForm;
