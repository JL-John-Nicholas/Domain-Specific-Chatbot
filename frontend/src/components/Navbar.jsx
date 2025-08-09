// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  // Centralized auth check function
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // Check token expiration
      if (decoded.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      setUserEmail(decoded.email || 'User');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    const intervalId = setInterval(checkAuthStatus, 5000);

    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link
            to="/"
            className="text-lg font-bold text-gray-800 hover:text-indigo-600 transition-colors"
          >
            PDF Chatbot
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Hi, <span className="font-medium">{userEmail}</span>
                </span>
                <Link
                  to="/upload"
                  className="text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Upload
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
