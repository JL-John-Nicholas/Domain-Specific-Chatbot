// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChatbots = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login to view your dashboard');
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get('http://localhost:5000/api/chatbots', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setChatbots(res.data.chatbots || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch chatbots');
      } finally {
        setLoading(false);
      }
    };

    fetchChatbots();
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Your Chatbots</h2>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : chatbots.length === 0 ? (
        <p className="text-center text-gray-500">No chatbots found. Upload a PDF to create one.</p>
      ) : (
        <ul className="space-y-4">
          {chatbots.map((bot) => (
            <li
              key={bot._id}
              onClick={() => navigate(`/chat/${bot._id}`)}
              className="p-4 border rounded hover:bg-gray-100 cursor-pointer"
            >
              <p className="font-semibold">Name: {bot.name || 'Untitled Chatbot'}</p>
              <p className="text-sm text-gray-600">Created: {new Date(bot.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
