import { Outlet } from 'react-router-dom';
import Nav from '../components/nav';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Nav />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
