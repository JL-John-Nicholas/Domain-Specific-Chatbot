const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../utils/uploadToS3');

const {
  createChatbot,
  getUserChatbots,
  deleteChatbot,
  queryChatbot,
  addDocumentsToChatbot
} = require('../controllers/chatbotController');

// Upload multiple PDFs while creating chatbot
router.post('/create', protect, upload.array('pdfs'), createChatbot);

// Add more PDFs to existing chatbot
router.post('/:id/add-documents', protect, upload.array('pdfs'), addDocumentsToChatbot);

// Query chatbot (RAG)
router.post('/query', protect, queryChatbot);

// Get user chatbots
router.get('/', protect, getUserChatbots);

// Delete chatbot
router.delete('/:id', protect, deleteChatbot);

module.exports = router;
