import { createBrowserRouter } from 'react-router-dom';

import AdminProtectedRoute from './AdminProtectedRoutes.jsx';
import RootLayout from '../layouts/RootLayout.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import UserProfile from '../pages/UserProfile.jsx';
import AdminLogin from '../pages/admin/AdminLogin.jsx';
import Dashboard from '../pages/admin/Dashboard.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminJobs from '../pages/admin/AdminJobs.jsx';
import AdminApplicationsRecent from '../pages/admin/AdminApplicationsRecent.jsx';
import AdminApplications from '../pages/admin/AdminApplications.jsx';
import JobsPublic from '../pages/JobsPublic.jsx';
import JobDetail from '../pages/JobsDetail.jsx';
import ScheduleInterview from '../pages/admin/ScheduleInterview.jsx';
import AdminInterviewCalendar from '../pages/admin/AdminInterviewCalendar.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx'; // ✅ NEW
import AdminShortlist from '../pages/admin/AdminShortlist.jsx';

const router = createBrowserRouter([
  // ========================
  // CLIENT ROUTES
  // ========================
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'jobs', element: <JobsPublic /> },
      { path: 'jobs/:id', element: <JobDetail /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'profile', element: <UserProfile /> },
    ],
  },

  // ========================
  // ADMIN ROUTES (Protected)
  // ========================
  {
    path: '/admin',
    element: <AdminProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'jobs', element: <AdminJobs /> },
          {
            path: 'applications',
            children: [
              { path: 'recent', element: <AdminApplicationsRecent /> },
              { path: 'by-job', element: <AdminApplications /> },
            ],
          },
          { path: 'schedule', element: <ScheduleInterview /> },
          { path: 'interviews', element: <AdminInterviewCalendar /> },

          // ✅ NEW: ROUTE QUẢN LÝ USERS
          { path: 'users', element: <AdminUsers /> },
          { path: 'shortlist', element: <AdminShortlist /> },
        ],
      },
    ],
  },

  // ========================
  // ADMIN LOGIN (Public)
  // ========================
  { path: '/admin/login', element: <AdminLogin /> },
]);

export default router;
