// Shown while the app checks a saved login, so the page never "flashes" the wrong screen.
function FullPageMessage({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-3 p-4 text-muted">
      {children}
    </main>
  );
}

export default FullPageMessage;
