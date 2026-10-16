import { Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PlansPage from './pages/PlansPage.jsx';

// Which page is shown for which URL.
function App() {
  return (
    <Routes>
      {/* Only for visitors who are NOT logged in */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Only for logged-in users, all inside the shared layout (header + menu) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          {/* Admin-only pages */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/plans" element={<PlansPage />} />
          </Route>
        </Route>
      </Route>

      {/* Any unknown URL goes to the home page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
