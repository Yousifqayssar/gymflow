import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import AuthCard from '../components/AuthCard.jsx';
import FormField from '../components/FormField.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Button from '../components/ui/Button.jsx';
import { toFieldErrors } from '../utils/fieldErrors.js';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
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
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(toFieldErrors(err.details));
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Join the gym as a member – it takes less than a minute.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        {/* Side by side on wider screens, stacked on phones */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={handleChange}
            error={fieldErrors.firstName}
          />
          <FormField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
          />
        </div>
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
        <p className="-mt-2 text-xs text-slate-500">At least 8 characters.</p>

        <Button type="submit" disabled={isSubmitting} className="w-full py-2.5">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

export default RegisterPage;
