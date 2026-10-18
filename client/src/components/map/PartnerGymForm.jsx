import { lazy, Suspense, useState } from 'react';
import { MapPin } from 'lucide-react';
import FormField from '../FormField.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import Button from '../ui/Button.jsx';
import { toFieldErrors } from '../../utils/fieldErrors.js';
import { WEEKDAY_NAMES } from '../../utils/openingHours.js';

const GymMap = lazy(() => import('./GymMap.jsx'));

const DEFAULT_HOURS = { open: '07:00', close: '22:00' };
// A new gym starts open Monday to Saturday; the admin only changes what is different.
const NEW_GYM_HOURS = [1, 2, 3, 4, 5, 6].map((day) => ({ day, ...DEFAULT_HOURS }));

// Form state for the hours: one row per weekday, so closed days can be switched on again
// without losing their times. Only open days are sent to the API.
function hoursToRows(hours = []) {
  return [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const row = hours.find((h) => h.day === day);
    return { day, isOpen: Boolean(row), open: row?.open ?? DEFAULT_HOURS.open, close: row?.close ?? DEFAULT_HOURS.close };
  });
}

// Add or edit a partner gym. Click on the map to set its position.
function PartnerGymForm({ initialGym, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: initialGym?.name ?? '',
    address: initialGym?.address ?? '',
    district: initialGym?.district ?? '',
    phone: initialGym?.phone ?? '',
  });
  const [position, setPosition] = useState(initialGym ? { latitude: initialGym.latitude, longitude: initialGym.longitude } : null);
  const [rows, setRows] = useState(() => hoursToRows(initialGym ? initialGym.hours : NEW_GYM_HOURS));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateRow = (day, changes) => setRows((current) => current.map((row) => (row.day === day ? { ...row, ...changes } : row)));

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setFieldErrors({});
    try {
      await onSubmit({
        ...values,
        latitude: position?.latitude,
        longitude: position?.longitude,
        hours: rows.filter((row) => row.isOpen).map(({ day, open, close }) => ({ day, open, close })),
      });
    } catch (err) {
      const errors = toFieldErrors(err.details);
      // Hours errors come as "hours.0.close"; show one general message for them.
      const hoursError = Object.entries(errors).find(([field]) => field.startsWith('hours'))?.[1];
      setFieldErrors({ ...errors, hours: hoursError });
      setError(err.details?.length ? '' : err.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Rounded to 6 decimals (about 10 cm), like the database stores it.
  const round = (value) => Math.round(value * 1e6) / 1e6;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" name="name" value={values.name} onChange={handleChange} error={fieldErrors.name} />
        <FormField label="Phone (optional)" name="phone" value={values.phone} onChange={handleChange} error={fieldErrors.phone} />
        <FormField label="Address" name="address" value={values.address} onChange={handleChange} error={fieldErrors.address} />
        <FormField label="District" name="district" placeholder="Besiktas, Istanbul" value={values.district} onChange={handleChange} error={fieldErrors.district} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-2">Position on the map</p>
        <p className="mb-2 text-sm text-muted">Click on the map where the gym is.</p>
        <div className="h-64 overflow-hidden rounded-xl border border-line">
          <Suspense fallback={<div className="size-full animate-pulse bg-surface-3" />}>
            <GymMap
              gyms={position ? [{ id: 'new', name: values.name || 'New gym', ...position }] : []}
              selectedId={null}
              onMapClick={(clicked) => setPosition({ latitude: round(clicked.latitude), longitude: round(clicked.longitude) })}
              className="size-full cursor-crosshair"
            />
          </Suspense>
        </div>
        <p className={`mt-1.5 flex items-center gap-1.5 text-sm ${fieldErrors.latitude || fieldErrors.longitude ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>
          <MapPin className="size-4" aria-hidden="true" />
          {position ? `${position.latitude}, ${position.longitude}` : fieldErrors.latitude ?? 'No position chosen yet'}
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Opening hours</legend>
        <div className="divide-y divide-line-soft rounded-xl border border-line">
          {rows.map((row) => (
            <div key={row.day} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <label className="flex w-36 items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" checked={row.isOpen} onChange={(e) => updateRow(row.day, { isOpen: e.target.checked })} className="size-4 accent-brand-700" />
                {WEEKDAY_NAMES[row.day]}
              </label>
              {row.isOpen ? (
                <span className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    aria-label={`${WEEKDAY_NAMES[row.day]} opens`}
                    value={row.open}
                    onChange={(e) => updateRow(row.day, { open: e.target.value })}
                    className="rounded-lg border border-line-strong bg-surface px-2 py-1 text-ink"
                  />
                  <span className="text-muted">to</span>
                  <input
                    type="time"
                    aria-label={`${WEEKDAY_NAMES[row.day]} closes`}
                    value={row.close}
                    onChange={(e) => updateRow(row.day, { close: e.target.value })}
                    className="rounded-lg border border-line-strong bg-surface px-2 py-1 text-ink"
                  />
                </span>
              ) : (
                <span className="text-sm text-faint">Closed</span>
              )}
            </div>
          ))}
        </div>
        {fieldErrors.hours && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{fieldErrors.hours}</p>}
      </fieldset>

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

export default PartnerGymForm;
