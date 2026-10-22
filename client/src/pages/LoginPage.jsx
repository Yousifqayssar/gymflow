import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Clock } from 'lucide-react';
import { SESSION_EXPIRED_MESSAGE } from '../api/client.js';
import { useAuth } from '../auth/useAuth.js';
import AuthCard from '../components/AuthCard.jsx';
import FormField from '../components/FormField.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Button from '../components/ui/Button.jsx';
import { toFieldErrors } from '../utils/fieldErrors.js';

function LoginPage() {
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // One handler for all inputs: uses the input's name to update the right field.
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(form);
      // Go back to the page the user originally wanted, or to the home page.
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(toFieldErrors(err.details));
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Welcome back" tabTitle="Log in" subtitle="Log in to your GymFlow account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {sessionExpired && !error && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {SESSION_EXPIRED_MESSAGE}
          </p>
        )}
        <ErrorMessage>{error}</ErrorMessage>

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
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full py-2.5">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        New member?{' '}
        <Link to="/register" className="font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

export default LoginPage;
