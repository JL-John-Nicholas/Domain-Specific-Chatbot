// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="p-6 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
