const Chatbot = require('../models/Chatbot');
const axios = require('axios');

const createChatbot = async (req, res) => {
  let newChatbot;
  try {
    const { name, domain, description, config } = req.body;
    const userId = req.user.userId;

    // Make sure multer uploaded file to S3
    if (!req.file || !req.file.location) {
      return res.status(400).json({ message: 'File upload failed' });
    }
    const fileUrl = req.file.location;

    // Save chatbot with initial status 'processing'
    newChatbot = new Chatbot({
      user: userId,
      name,
      domain,
      description,
      config,
      status: 'processing'
    });
    await newChatbot.save();

    // Call Flask AI microservice
    await axios.post(`${process.env.FLASK_URL}/process-pdf`, {
      file_url: fileUrl,
      chatbot_id: newChatbot._id.toString()
    });

    // Mark chatbot as ready
    newChatbot.status = 'ready';
    await newChatbot.save();

    res.status(201).json(newChatbot);
  } catch (err) {
    console.error('Error creating chatbot:', err);

    // If chatbot exists, mark as failed
    if (newChatbot) {
      newChatbot.status = 'failed';
      await newChatbot.save();
    }

    res.status(500).json({ message: 'Server error creating chatbot' });
  }
};

const getUserChatbots = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chatbots = await Chatbot.find({ user: userId }).sort({ createdAt: -1 });
    res.json(chatbots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching chatbots' });
  }
};

const deleteChatbot = async (req, res) => {
  try {
    const chatbotId = req.params.id;
    const userId = req.user.userId;

    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    await chatbot.deleteOne();
    res.json({ message: 'Chatbot deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting chatbot' });
  }
};

const queryChatbot = async (req, res) => {
  try {
    const { chatbotId, question } = req.body;
    const userId = req.user.userId;

    // Check if chatbot exists and belongs to user
    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    // Forward question to Flask microservice
    const flaskResponse = await axios.post('http://localhost:5001/query', {
      question,
      chatbot_id: chatbotId,
    });

    const { answer, sources } = flaskResponse.data;

    res.json({ answer, sources });

  } catch (err) {
    console.error("❌ Error querying chatbot:", err.message);
    res.status(500).json({ message: 'Failed to query chatbot' });
  }
};

module.exports = {
  createChatbot,
  getUserChatbots,
  deleteChatbot,
  queryChatbot
};
