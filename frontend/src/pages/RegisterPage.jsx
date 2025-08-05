import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '' 
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
      
      // Updated endpoint to match your backend
      const res = await axios.post('http://localhost:5000/api/auth/signup', form, {
        headers: {
          'Content-Type': 'application/json'
        }
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
      
      // Enhanced error handling
      let errorMessage = 'Registration failed';
      if (err.response) {
        errorMessage = err.response.data.message || 
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full p-2 border rounded"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 characters)"
          className="w-full p-2 border rounded"
          value={form.password}
          onChange={handleChange}
          minLength="6"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded transition ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;