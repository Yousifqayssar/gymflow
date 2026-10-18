import { useAuth } from '../auth/useAuth.js';
import MyWorkoutsPage from './MyWorkoutsPage.jsx';
import StaffWorkoutsPage from './StaffWorkoutsPage.jsx';

// /workouts: members see their own plans, trainers and admins manage the plans of all members.
function WorkoutsPage() {
  const { user } = useAuth();
  return user.role === 'MEMBER' ? <MyWorkoutsPage /> : <StaffWorkoutsPage />;
}

export default WorkoutsPage;
