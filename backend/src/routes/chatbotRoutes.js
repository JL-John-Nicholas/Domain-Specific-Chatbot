const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../utils/uploadToS3');

const {
  createChatbot,
  getUserChatbots,
  deleteChatbot,
  queryChatbot
} = require('../controllers/chatbotController');

// Upload + create chatbot
router.post('/create', protect, upload.single('pdf'), createChatbot);

// Query chatbot (RAG)
router.post('/query', protect, queryChatbot);

// Get user chatbots
router.get('/', protect, getUserChatbots);

// Delete chatbot
router.delete('/:id', protect, deleteChatbot);

module.exports = router;
