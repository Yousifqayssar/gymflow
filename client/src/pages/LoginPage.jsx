import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import AuthCard from '../components/AuthCard.jsx';
import FormField from '../components/FormField.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { toFieldErrors } from '../utils/fieldErrors.js';

function LoginPage() {
  const { login } = useAuth();
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
    <AuthCard title="Welcome back" subtitle="Log in to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New member?{' '}
        <Link to="/register" className="font-medium text-slate-900 underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

export default LoginPage;
