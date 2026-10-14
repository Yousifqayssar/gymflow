import SystemStatus from './components/SystemStatus.jsx';

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-md">
        <h1 className="text-3xl font-bold text-slate-900">GymFlow</h1>
        <p className="mt-2 text-slate-600">
          Gym membership, class management and workout tracking.
        </p>
        <SystemStatus />
      </div>
    </main>
  );
}

export default App;
