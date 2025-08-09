import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const [pdfs, setPdfs] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = selectedFiles.filter(file => file.type === 'application/pdf');

    if (validPdfs.length === 0) {
      toast.error('Only PDF files are allowed');
      return;
    }

    setPdfs(validPdfs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pdfs.length === 0 || !name.trim()) {
      return toast.warn('Please provide a name and select at least one PDF');
    }

    const formData = new FormData();
    pdfs.forEach(pdf => formData.append('pdfs', pdf));
    formData.append('name', name);

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to upload files');
        return navigate('/login');
      }

      await axios.post(
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
      navigate('/dashboard');
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
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Upload PDF(s)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Chatbot Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chatbot Name
          </label>
          <input
            type="text"
            placeholder="Enter chatbot name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* PDF Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select PDF(s)
          </label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          {pdfs.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {pdfs.length} file(s) selected
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 font-medium ${
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
