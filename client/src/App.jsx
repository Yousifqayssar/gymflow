import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import MembersPage from './pages/MembersPage.jsx';
import MemberDetailPage from './pages/MemberDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ClassesPage from './pages/ClassesPage.jsx';
import ClassDetailPage from './pages/ClassDetailPage.jsx';
import ClassFormPage from './pages/ClassFormPage.jsx';
import MyQrPage from './pages/MyQrPage.jsx';

// The check-in page contains the camera QR scanner (large). Loading it only when it is opened
// keeps the app fast for members, who never use it.
const CheckInPage = lazy(() => import('./pages/CheckInPage.jsx'));

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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/classes/:id" element={<ClassDetailPage />} />

          {/* Member pages */}
          <Route element={<ProtectedRoute roles={['MEMBER']} />}>
            <Route path="/my-qr" element={<MyQrPage />} />
          </Route>

          {/* Admin and trainer pages */}
          <Route element={<ProtectedRoute roles={['ADMIN', 'TRAINER']} />}>
            <Route
              path="/check-in"
              element={
                <Suspense fallback={<p className="text-slate-500">Loading check-in…</p>}>
                  <CheckInPage />
                </Suspense>
              }
            />
            <Route path="/classes/new" element={<ClassFormPage />} />
            <Route path="/classes/:id/edit" element={<ClassFormPage />} />
          </Route>

          {/* Admin-only pages */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/people" element={<MembersPage />} />
            <Route path="/people/:id" element={<MemberDetailPage />} />
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
