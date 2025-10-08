import { createBrowserRouter } from 'react-router-dom';

import AdminProtectedRoute from './AdminProtectedRoutes.jsx';
import RootLayout from '../layouts/RootLayout.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/auth/login.jsx';
import Register from '../pages/auth/Register.jsx';
import UserProfile from '../pages/UserProfile.jsx';
import AdminLogin from '../pages/admin/AdminLogin.jsx';
import Dashboard from '../pages/admin/Dashboard.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: 'profile', element: <UserProfile /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [{ path: 'dashboard', element: <Dashboard /> }],
      },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
]);

export default router;
