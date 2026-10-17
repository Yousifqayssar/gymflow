import { useState } from 'react';
import FormField from './FormField.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { toFieldErrors } from '../utils/fieldErrors.js';
import Button from './ui/Button.jsx';

// Admin form for creating a Member or Trainer account.
// `onSubmit` receives { firstName, lastName, email, password, role } and may throw an ApiError.
function UserForm({ initialRole = 'MEMBER', onSubmit, onCancel }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: initialRole });
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
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
      setFieldErrors(toFieldErrors(err.details));
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage>{error}</ErrorMessage>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-ink-2">Account type</legend>
        <div className="flex gap-4">
          {[
            ['MEMBER', 'Member'],
            ['TRAINER', 'Trainer'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-ink-2">
              <input type="radio" name="role" value={value} checked={form.role === value} onChange={handleChange} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First name" name="firstName" required value={form.firstName} onChange={handleChange} error={fieldErrors.firstName} />
        <FormField label="Last name" name="lastName" required value={form.lastName} onChange={handleChange} error={fieldErrors.lastName} />
        <FormField label="Email" name="email" type="email" required value={form.email} onChange={handleChange} error={fieldErrors.email} />
        <FormField
          label="Initial password"
          name="password"
          type="text"
          autoComplete="off"
          required
          minLength={8}
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
      </div>
      <p className="-mt-2 text-xs text-muted">At least 8 characters. Give it to the person so they can log in.</p>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create account'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default UserForm;
