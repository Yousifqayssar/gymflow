import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';

// The other pages are loaded only when they are opened ("code splitting"): the first download
// stays small, and e.g. members never download the camera QR scanner of the check-in page.
// While a page loads, <Suspense> in AppLayout shows a short placeholder.
const PlansPage = lazy(() => import('./pages/PlansPage.jsx'));
const MembersPage = lazy(() => import('./pages/MembersPage.jsx'));
const MemberDetailPage = lazy(() => import('./pages/MemberDetailPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const ClassesPage = lazy(() => import('./pages/ClassesPage.jsx'));
const ClassDetailPage = lazy(() => import('./pages/ClassDetailPage.jsx'));
const ClassFormPage = lazy(() => import('./pages/ClassFormPage.jsx'));
const MyQrPage = lazy(() => import('./pages/MyQrPage.jsx'));
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
            <Route path="/check-in" element={<CheckInPage />} />
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
