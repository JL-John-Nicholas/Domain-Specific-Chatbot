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
        console.log('Fetched chatbots:', res.data);

        setChatbots(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch chatbots');
      } finally {
        setLoading(false);
      }
    };

    fetchChatbots();
  }, [navigate]);

  const handleDelete = async (chatbotId, e) => {
    e.stopPropagation(); // Prevent triggering navigation to chatbot page

    const confirm = window.confirm('Are you sure you want to delete this chatbot?');
    if (!confirm) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/chatbots/${chatbotId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from state
      setChatbots(prev => prev.filter(bot => bot._id !== chatbotId));
      toast.success('Chatbot deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete chatbot');
    }
  };


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
              className="p-4 border rounded hover:bg-gray-100 flex justify-between items-center"
            >
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/chat/${bot._id}`)}
              >
                <p className="font-semibold">Name: {bot.name || 'Untitled Chatbot'}</p>
                <p className="text-sm text-gray-600">Created: {new Date(bot.createdAt).toLocaleString()}</p>
              </div>

              <button
                onClick={(e) => handleDelete(bot._id, e)}
                className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
