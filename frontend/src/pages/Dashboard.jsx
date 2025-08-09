import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleDocs, setVisibleDocs] = useState({}); // Track which chatbot's docs are shown
  const [documents, setDocuments] = useState({}); // Store documents for each chatbot
  const navigate = useNavigate();

  const fileInputRefs = useRef({});

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

    if (!window.confirm('Are you sure you want to delete this chatbot?')) return;

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
    e.stopPropagation(); // ⛔ prevent triggering chatbot navigation
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

      // Optionally refresh documents if they were visible
      if (visibleDocs[chatbotId]) {
        await fetchDocuments(chatbotId);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add documents');
    } finally {
      e.target.value = '';
    }
  };

  const fetchDocuments = async (chatbotId) => {
    const token = localStorage.getItem('token');

    try {
      const res = await axios.get(`http://localhost:5000/api/chatbots/${chatbotId}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDocuments((prev) => ({ ...prev, [chatbotId]: res.data }));
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load documents');
    }
  };

  const toggleDocs = async (chatbotId, e) => {
    e.stopPropagation();
    const isVisible = visibleDocs[chatbotId];

    if (!isVisible && !documents[chatbotId]) {
      await fetchDocuments(chatbotId);
    }

    setVisibleDocs((prev) => ({
      ...prev,
      [chatbotId]: !prev[chatbotId],
    }));
  };

  const triggerFileInput = (chatbotId, e) => {
    e.stopPropagation();
    if (fileInputRefs.current[chatbotId]) {
      fileInputRefs.current[chatbotId].click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Your Chatbots
      </h2>

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse">Loading...</p>
      ) : chatbots.length === 0 ? (
        <p className="text-center text-gray-500">
          No chatbots found. Upload a PDF to create one.
        </p>
      ) : (
        <ul className="space-y-5">
          {chatbots.map((bot) => (
            <li
              key={bot._id}
              className="p-5 bg-gray-50 border rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              {/* Bot Header */}
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div
                  onClick={() => navigate(`/chat/${bot._id}`, { state: { chatbotName: bot.name } })}
                  className="cursor-pointer"
                >
                  <p className="font-semibold text-blue-600 hover:text-blue-800 underline text-lg">
                    {bot.name || 'Untitled Chatbot'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(bot.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput(bot._id, e);
                    }}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition"
                  >
                    Add Docs
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDocs(bot._id, e);
                    }}
                    className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition"
                  >
                    {visibleDocs[bot._id] ? 'Hide PDFs' : 'View PDFs'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(bot._id, e);
                    }}
                    className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* PDF List */}
              {visibleDocs[bot._id] && (
                <div className="mt-4 bg-gray-100 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-700 mb-2">PDF Documents:</p>
                  <ul className="space-y-1">
                    {(documents[bot._id] || []).map((doc) => (
                      <li
                        key={doc._id}
                        className="text-sm text-blue-700 hover:text-blue-900 underline truncate"
                      >
                        <a
                          href={doc.s3Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {decodeURIComponent(doc.s3Url.split('/').pop())}
                        </a>
                      </li>
                    ))}
                    {documents[bot._id]?.length === 0 && (
                      <li className="text-sm text-gray-500">
                        No documents found.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Hidden file input */}
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
