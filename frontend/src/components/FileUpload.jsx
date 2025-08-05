import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const [pdf, setPdf] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setPdf(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdf || !name.trim()) return toast.warn('Please provide a name and select a PDF');

    const formData = new FormData();
    formData.append('pdf', pdf);
    formData.append('name', name); // ✅ Include name in the request

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to upload files');
        return navigate('/login');
      }

      const res = await axios.post(
        'http://localhost:5000/api/chatbots/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      toast.success('PDF uploaded successfully');
      navigate(`/chat/${res.data.chatbot_id}`);
    } catch (err) {
      console.error('Upload error:', err);

      let errorMessage = 'Upload failed. Try again.';
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.removeItem('token');
        navigate('/login');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Upload a PDF</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter chatbot name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full border p-2 mb-4"
          required
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="block w-full border p-2 mb-4"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
