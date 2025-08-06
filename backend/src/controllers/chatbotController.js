const Chatbot = require('../models/Chatbot');
const Document = require('../models/Document');
const axios = require('axios');

const createChatbot = async (req, res) => {
  let newChatbot;
  try {
    const { name, domain, description, config } = req.body;
    const userId = req.user.userId;

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No PDFs uploaded' });
    }

    // Create chatbot
    newChatbot = new Chatbot({
      user: userId,
      name,
      domain,
      description,
      config,
      status: 'processing'
    });
    await newChatbot.save();

    const fileUrls = [];

    // Save all documents to DB and collect S3 URLs
    for (const file of files) {
      if (!file.location) continue;

      fileUrls.push(file.location);

      await Document.create({
        chatbot: newChatbot._id,
        s3Url: file.location
      });
    }

    // Send to Flask for processing
    await axios.post(`${process.env.FLASK_URL}/process-pdf`, {
      chatbot_id: newChatbot._id.toString(),
      file_urls: fileUrls
    });

    newChatbot.status = 'ready';
    await newChatbot.save();

    res.status(201).json(newChatbot);

  } catch (err) {
    console.error('Error creating chatbot:', err);

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

const addDocumentsToChatbot = async (req, res) => {
  try {
    const chatbotId = req.params.id;
    const userId = req.user.userId;

    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileUrls = [];

    for (const file of files) {
      if (!file.location) continue;

      fileUrls.push(file.location);

      await Document.create({
        chatbot: chatbot._id,
        s3Url: file.location
      });
    }

    // Send newly added files to Flask
    await axios.post(`${process.env.FLASK_URL}/process-pdf`, {
      chatbot_id: chatbot._id.toString(),
      file_urls: fileUrls
    });

    res.json({ message: 'Documents added successfully' });

  } catch (err) {
    console.error('Error adding documents:', err);
    res.status(500).json({ message: 'Failed to add documents' });
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
    const { chatbot_id, question } = req.body;
    const userId = req.user.userId;

    // Check if chatbot exists and belongs to user
    const chatbot = await Chatbot.findOne({ _id: chatbot_id, user: userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    // Forward question to Flask microservice
    const flaskResponse = await axios.post('http://localhost:5001/query', {
      question,
      chatbot_id: chatbot_id,
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
  queryChatbot,
  addDocumentsToChatbot
};
