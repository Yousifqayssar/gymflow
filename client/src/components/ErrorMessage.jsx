// A red box for a general error, e.g. "Invalid email or password".
// role="alert" makes screen readers announce it immediately.
function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </div>
  );
}

export default ErrorMessage;
