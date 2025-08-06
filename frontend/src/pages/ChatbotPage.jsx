import { useParams } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ChatbotPage = () => {
  const { id } = useParams(); // chatbot_id from URL
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const botReply = res.data.answer;
      setChat([...newChat, { sender: 'bot', text: botReply }]);
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to get response from bot');
      setChat(newChat); // keep user message even if bot fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 p-4 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Chat with PDF</h2>

      <div className="h-96 overflow-y-auto border p-4 mb-4 space-y-2 bg-gray-50 rounded">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded ${msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'
              }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatbotPage;
