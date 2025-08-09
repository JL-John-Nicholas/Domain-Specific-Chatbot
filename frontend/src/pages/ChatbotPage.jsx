import { useParams, useLocation } from 'react-router-dom'; // ⬅ add useLocation
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ChatbotPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const chatbotName = location.state?.chatbotName || 'Chatbot'; // ⬅ get chatbot name

  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newChat = [...chat, { sender: 'user', text: message }];
    setChat(newChat);
    setMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/chatbots/query',
        {
          chatbot_id: id,
          question: message,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const botReply = res.data.answer;
      setChat([...newChat, { sender: 'bot', text: botReply }]);
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to get response from bot');
      setChat(newChat);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white shadow-lg rounded-lg flex flex-col h-[80vh] border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b bg-gray-100 rounded-t-lg">
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          Chat with {chatbotName} {/* ⬅ dynamic title */}
        </h2>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chat.length === 0 && (
          <p className="text-center text-gray-400">
            Start the conversation by asking a question.
          </p>
        )}

        {chat.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={sendMessage}
        className="p-4 border-t bg-white flex gap-2 rounded-b-lg"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-5 py-2 rounded-lg text-white font-medium transition ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatbotPage;
