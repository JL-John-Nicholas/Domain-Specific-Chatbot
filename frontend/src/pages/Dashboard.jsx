// src/pages/Dashboard.jsx
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fileInputRefs = useRef({}); // Store input refs for each chatbot

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
    e.stopPropagation();

    const confirm = window.confirm('Are you sure you want to delete this chatbot?');
    if (!confirm) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/chatbots/${chatbotId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChatbots(prev => prev.filter(bot => bot._id !== chatbotId));
      toast.success('Chatbot deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete chatbot');
    }
  };

  const handleFileChange = async (chatbotId, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append('pdfs', file);
    }

    const token = localStorage.getItem('token');

    try {
      await axios.post(`http://localhost:5000/api/chatbots/${chatbotId}/add-documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Documents added successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add documents');
    } finally {
      // Reset the file input
      e.target.value = '';
    }
  };

  const triggerFileInput = (chatbotId, e) => {
    e.stopPropagation();
    if (fileInputRefs.current[chatbotId]) {
      fileInputRefs.current[chatbotId].click();
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

              <div className="flex gap-2">
                <button
                  onClick={(e) => triggerFileInput(bot._id, e)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Add Docs
                </button>

                <button
                  onClick={(e) => handleDelete(bot._id, e)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>

              {/* Hidden file input for document upload */}
              <input
                type="file"
                multiple
                accept=".pdf"
                ref={(el) => (fileInputRefs.current[bot._id] = el)}
                onChange={(e) => handleFileChange(bot._id, e)}
                style={{ display: 'none' }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
