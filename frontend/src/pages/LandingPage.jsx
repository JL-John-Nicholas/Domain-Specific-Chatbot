// src/pages/LandingPage.jsx
import { Link, Navigate } from 'react-router-dom';

const LandingPage = () => {
  const token = localStorage.getItem('token');

  // 🔁 Redirect logged-in users to dashboard or upload page
  if (token) return <Navigate to="/dashboard" />;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to PDF Chatbot</h1>
      <p className="mb-6 text-gray-700">
        Upload your PDF documents and start chatting with them using AI. Our platform helps you quickly extract answers and insights from any document.
      </p>
      <div className="space-x-4">
        <Link
          to="/login"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
