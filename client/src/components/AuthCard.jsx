// Centered card used by the login and register pages.
function AuthCard({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md sm:p-8">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
          GymFlow
        </p>
        <h1 className="mt-1 text-center text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-slate-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export default AuthCard;
