// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <Outlet />
        </div>
      </main>

      {/* Footer (optional, can remove) */}
      <footer className="text-center text-sm text-gray-500 py-4 border-t bg-gray-50">
        © {new Date().getFullYear()} Chatbot Platform — All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
