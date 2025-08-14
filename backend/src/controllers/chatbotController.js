const Chatbot = require('../models/Chatbot');
const Document = require('../models/Document');
const axios = require('axios');
const aws = require('aws-sdk');

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

const getChatbotDocuments = async (req, res) => {
  try {
    const chatbotId = req.params.id;
    const userId = req.user.userId;

    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    const documents = await Document.find({ chatbot: chatbotId });
    res.json(documents);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const deleteChatbot = async (req, res) => {
  try {
    const chatbotId = req.params.id;
    const userId = req.user.userId;

    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    // 1️⃣ Delete embeddings in Pinecone via Flask service
    try {
      await axios.post(`${process.env.FLASK_URL}/delete-embeddings`, {
        chatbot_id: chatbotId
      });
    } catch (flaskErr) {
      console.error("Error deleting embeddings in Pinecone:", flaskErr.message);
    }

    // 2️⃣ Find documents for this chatbot
    const docs = await Document.find({ chatbot: chatbotId });

    // 3️⃣ Delete files from S3
    for (const doc of docs) {
      try {
        const key = decodeURIComponent(doc.s3Url.split('.amazonaws.com/')[1]);
        await s3.deleteObject({
          Bucket: process.env.S3_BUCKET,
          Key: key
        }).promise();
        console.log(`Deleted file from S3: ${key}`);
      } catch (s3Err) {
        console.error(`Error deleting file from S3: ${doc.s3Url}`, s3Err.message);
      }
    }

    // 4️⃣ Delete document records from DB
    await Document.deleteMany({ chatbot: chatbotId });

    // 5️⃣ Delete chatbot record from DB
    await chatbot.deleteOne();

    res.json({ message: 'Chatbot and associated files deleted successfully' });

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
    const flaskResponse = await axios.post(`${process.env.FLASK_URL}/query`, {
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
  addDocumentsToChatbot,
  getChatbotDocuments
};
