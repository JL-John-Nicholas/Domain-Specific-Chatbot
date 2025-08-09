// src/pages/RegisterPage.jsx
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return toast.warn('Please fill in all fields');
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return toast.warn('Please enter a valid email');
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/signup', form, {
        headers: { 'Content-Type': 'application/json' },
      });

      const { token } = res.data;

      if (!token) {
        throw new Error('No token received');
      }

      localStorage.setItem('token', token);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed';
      if (err.response) {
        errorMessage =
          err.response.data.message ||
          err.response.data.error ||
          `Server error: ${err.response.status}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Create your <span className="text-green-600">PDF Chatbot</span> account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              minLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg shadow-sm font-medium transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
