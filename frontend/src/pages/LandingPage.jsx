// src/pages/LandingPage.jsx
import { Link, Navigate } from 'react-router-dom';

const LandingPage = () => {
  const token = localStorage.getItem('token');

  // Redirect logged-in users
  if (token) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-6">
      <div className="max-w-3xl text-center bg-white shadow-lg rounded-2xl p-10 border border-gray-100">
        {/* Heading */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Welcome to <span className="text-indigo-600">PDF Chatbot</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Upload your PDF documents and chat with them using AI.  
          Get quick answers, insights, and summaries without reading the whole file.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 text-indigo-600 border border-indigo-600 hover:bg-indigo-50 rounded-lg shadow-sm transition-colors font-medium"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
