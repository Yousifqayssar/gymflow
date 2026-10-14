// Shown while the app checks a saved login, so the page never "flashes" the wrong screen.
function FullPageMessage({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-500">
      {children}
    </main>
  );
}

export default FullPageMessage;
