import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import FormField from '../FormField.jsx';
import TextAreaField from '../TextAreaField.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import ExercisePicker from './ExercisePicker.jsx';
import PlanTabs from './PlanTabs.jsx';
import { MUSCLE_GROUPS } from '../../utils/exerciseDisplay.js';
import { formatRest, totalSets } from '../../utils/workoutDisplay.js';

const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240];
let nextKey = 1; // stable React keys for rows that are not saved yet
const newKey = () => `k${nextKey++}`;

// Plan from the API → form state (numbers become text for the inputs).
function toFormState(plan) {
  if (!plan) {
    return { name: '', notes: '', isActive: true, days: [{ key: newKey(), name: 'Day A', exercises: [] }] };
  }
  return {
    name: plan.name,
    notes: plan.notes ?? '',
    isActive: plan.isActive,
    days: plan.days.map((day) => ({
      key: newKey(),
      name: day.name,
      exercises: day.exercises.map((item) => ({
        key: newKey(),
        exercise: item.exercise,
        sets: String(item.sets),
        reps: String(item.reps),
        targetWeightKg: item.targetWeightKg === null ? '' : String(item.targetWeightKg),
        restSeconds: item.restSeconds,
        notes: item.notes ?? '',
      })),
    })),
  };
}

const toNumber = (text) => (String(text).trim() === '' ? null : Number(String(text).replace(',', '.')));

// Swaps two items of a list (for the up/down buttons).
function move(list, from, to) {
  const copy = [...list];
  [copy[from], copy[to]] = [copy[to], copy[from]];
  return copy;
}

const smallInput =
  'w-full rounded-lg border border-line-strong bg-surface px-2 py-1.5 text-center text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-500/25';

// The form trainers use to write or change a workout plan: name, notes, days and their exercises.
function PlanBuilder({ memberId, initialPlan, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initialPlan));
  const [selectedDay, setSelectedDay] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [errors, setErrors] = useState({}); // "days.0.exercises.1.sets" → message
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const day = form.days[selectedDay];
  const setDays = (update) => setForm((current) => ({ ...current, days: update(current.days) }));
  const updateDay = (changes) => setDays((days) => days.map((d, i) => (i === selectedDay ? { ...d, ...changes } : d)));
  const updateExercise = (index, changes) => updateDay({ exercises: day.exercises.map((item, i) => (i === index ? { ...item, ...changes } : item)) });

  function addDay() {
    const letter = String.fromCharCode(65 + form.days.length); // A, B, C …
    setDays((days) => [...days, { key: newKey(), name: `Day ${letter}`, exercises: [] }]);
    setSelectedDay(form.days.length);
  }

  function removeDay() {
    setDays((days) => days.filter((_, i) => i !== selectedDay));
    setSelectedDay(Math.max(0, selectedDay - 1));
  }

  function addExercise(exercise) {
    const isBodyweight = exercise.equipment === 'BODYWEIGHT' || exercise.muscleGroup === 'CARDIO';
    updateDay({
      exercises: [
        ...day.exercises,
        { key: newKey(), exercise, sets: '3', reps: '10', targetWeightKg: isBodyweight ? '' : '20', restSeconds: 90, notes: '' },
      ],
    });
    setIsPickerOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setErrors({});
    try {
      await onSubmit({
        memberId,
        name: form.name,
        notes: form.notes,
        isActive: form.isActive,
        days: form.days.map((d) => ({
          name: d.name,
          exercises: d.exercises.map((item) => ({
            exerciseId: item.exercise.id,
            sets: toNumber(item.sets),
            reps: toNumber(item.reps),
            targetWeightKg: toNumber(item.targetWeightKg),
            restSeconds: item.restSeconds,
            notes: item.notes,
          })),
        })),
      });
    } catch (err) {
      const byField = Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message]));
      setErrors(byField);
      setError(err.details?.length ? 'Please check the marked fields.' : err.message);
      // Jump to the first day that has a problem.
      const firstDayError = Object.keys(byField).find((field) => field.startsWith('days.'));
      if (firstDayError) setSelectedDay(Number(firstDayError.split('.')[1]));
    } finally {
      setIsSaving(false);
    }
  }

  const fieldError = (path) => errors[path];

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card title="Plan">
        <div className="space-y-4">
          <FormField label="Name" name="name" placeholder="Strength – 3 days" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <TextAreaField
            label="Notes for the member (optional)"
            name="notes"
            rows={2}
            maxLength={500}
            placeholder="Warm up 10 minutes first."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            error={errors.notes}
          />
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 accent-brand-700" />
            Active – the member sees this plan
          </label>
        </div>
      </Card>

      <Card
        title="Training days"
        description={day ? `${day.exercises.length} exercises · ${totalSets({ exercises: day.exercises.map((e) => ({ sets: Number(e.sets) || 0 })) })} sets` : undefined}
        actions={
          form.days.length < 7 && (
            <Button variant="secondary" size="sm" icon={Plus} onClick={addDay}>
              Add day
            </Button>
          )
        }
      >
        <PlanTabs days={form.days} selected={selectedDay} onSelect={setSelectedDay} layoutId="builder-day-tab" />
        {errors.days && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.days}</p>}

        {day && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <FormField label="Day name" name="dayName" value={day.name} onChange={(e) => updateDay({ name: e.target.value })} error={fieldError(`days.${selectedDay}.name`)} />
              </div>
              {form.days.length > 1 && (
                <Button variant="danger" size="sm" icon={Trash2} onClick={removeDay}>
                  Remove day
                </Button>
              )}
            </div>

            {fieldError(`days.${selectedDay}.exercises`) && <p className="text-sm text-red-600 dark:text-red-400">{fieldError(`days.${selectedDay}.exercises`)}</p>}

            <ol className="space-y-3">
              {day.exercises.map((item, index) => {
                const { icon: Icon, gradient } = MUSCLE_GROUPS[item.exercise.muscleGroup];
                const path = `days.${selectedDay}.exercises.${index}`;
                const rowErrors = ['sets', 'reps', 'targetWeightKg', 'restSeconds', 'notes'].map((f) => fieldError(`${path}.${f}`)).filter(Boolean);
                return (
                  <li key={item.key} className={`rounded-2xl border p-4 ${rowErrors.length ? 'border-red-300 dark:border-red-500/50' : 'border-line'} bg-surface-2`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${gradient}`}>
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 font-semibold text-ink">
                        {index + 1}. {item.exercise.name}
                      </span>
                      <span className="flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => updateDay({ exercises: move(day.exercises, index, index - 1) })} aria-label="Move up" className="rounded-lg p-2 text-ink-3 hover:bg-surface-3 disabled:opacity-30">
                          <ArrowUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === day.exercises.length - 1}
                          onClick={() => updateDay({ exercises: move(day.exercises, index, index + 1) })}
                          aria-label="Move down"
                          className="rounded-lg p-2 text-ink-3 hover:bg-surface-3 disabled:opacity-30"
                        >
                          <ArrowDown className="size-4" />
                        </button>
                        <button type="button" onClick={() => updateDay({ exercises: day.exercises.filter((_, i) => i !== index) })} aria-label={`Remove ${item.exercise.name}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                          <X className="size-4" />
                        </button>
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ['sets', 'Sets'],
                        ['reps', 'Reps'],
                        ['targetWeightKg', 'Weight (kg)'],
                      ].map(([key, label]) => (
                        <label key={key} className="text-xs font-medium text-muted">
                          {label}
                          <input
                            inputMode="decimal"
                            value={item[key]}
                            placeholder={key === 'targetWeightKg' ? 'none' : ''}
                            onChange={(e) => updateExercise(index, { [key]: e.target.value })}
                            aria-invalid={fieldError(`${path}.${key}`) ? 'true' : undefined}
                            className={`mt-1 ${smallInput}`}
                          />
                        </label>
                      ))}
                      <label className="text-xs font-medium text-muted">
                        Rest
                        <select value={item.restSeconds} onChange={(e) => updateExercise(index, { restSeconds: Number(e.target.value) })} className={`mt-1 ${smallInput}`}>
                          {REST_OPTIONS.map((seconds) => (
                            <option key={seconds} value={seconds}>
                              {formatRest(seconds)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <input
                      value={item.notes}
                      onChange={(e) => updateExercise(index, { notes: e.target.value })}
                      placeholder="Note for the member (optional), e.g. slow on the way down"
                      aria-label={`Note for ${item.exercise.name}`}
                      maxLength={200}
                      className="mt-3 w-full rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink outline-none placeholder:text-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-500/25"
                    />
                    {rowErrors.length > 0 && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{rowErrors.join(' · ')}</p>}
                  </li>
                );
              })}
            </ol>

            {day.exercises.length < 15 && (
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong px-4 py-4 text-sm font-semibold text-ink-3 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add exercise
              </button>
            )}
          </div>
        )}
      </Card>

      <ErrorMessage>{error}</ErrorMessage>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : initialPlan ? 'Save plan' : 'Create plan'}
        </Button>
      </div>

    </form>
    {/* Outside the form: pressing Enter in the picker's search must not submit the plan */}
    <ExercisePicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onPick={addExercise} />
    </>
  );
}

export default PlanBuilder;
