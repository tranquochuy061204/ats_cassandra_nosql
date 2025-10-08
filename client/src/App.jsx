import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';

import router from './routes/index.jsx';
import { verifySession } from './utils/checkSession.jsx';

export default function App() {
  useEffect(() => {
    verifySession();
  }, []);

  return <RouterProvider router={router} />;
}
