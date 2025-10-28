const Chatbot = require('../models/Chatbot');
const Document = require('../models/Document');
const axios = require('axios');
const aws = require('aws-sdk');

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// 🧩 Create Chatbot
const createChatbot = async (req, res) => {
  console.log("\n🧩 [CREATE CHATBOT] Incoming request...");
  let newChatbot;

  try {
    console.log("📦 Body:", req.body);
    console.log("📎 Files:", req.files?.map(f => f.originalname));
    console.log("👤 User:", req.user);

    const { name, domain, description, config } = req.body;
    const userId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      console.log("⚠️ No PDF files uploaded!");
      return res.status(400).json({ message: 'No PDFs uploaded' });
    }

    // Create chatbot record
    newChatbot = new Chatbot({ user: userId, name, domain, description, config, status: 'processing' });
    await newChatbot.save();
    console.log(`✅ Created new chatbot: ${newChatbot._id}`);

    const fileUrls = [];

    // Save all documents to DB
    for (const file of req.files) {
      if (!file.location) {
        console.log("⚠️ Skipping file without S3 location:", file.originalname);
        continue;
      }

      fileUrls.push(file.location);
      console.log(`🪣 Added document URL: ${file.location}`);

      await Document.create({ chatbot: newChatbot._id, s3Url: file.location });
    }

    // Send to Flask for embedding processing
    console.log(`📡 Sending files to Flask: ${process.env.FLASK_URL}/process-pdf`);
    await axios.post(`${process.env.FLASK_URL}/process-pdf`, {
      chatbot_id: newChatbot._id.toString(),
      file_urls: fileUrls
    });

    newChatbot.status = 'ready';
    await newChatbot.save();

    console.log("✅ Chatbot processing completed successfully!");
    res.status(201).json(newChatbot);

  } catch (err) {
    console.error("❌ Error creating chatbot:", err.message);
    if (newChatbot) {
      newChatbot.status = 'failed';
      await newChatbot.save();
      console.log("💾 Updated chatbot status to FAILED:", newChatbot._id);
    }
    res.status(500).json({ message: 'Server error creating chatbot' });
  }
};


// 📋 Get User Chatbots
const getUserChatbots = async (req, res) => {
  console.log("\n📋 [GET USER CHATBOTS]");
  try {
    const userId = req.user.userId;
    console.log("👤 User:", userId);

    const chatbots = await Chatbot.find({ user: userId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${chatbots.length} chatbots`);
    res.json(chatbots);
  } catch (err) {
    console.error("❌ Error fetching chatbots:", err.message);
    res.status(500).json({ message: 'Server error fetching chatbots' });
  }
};


// 📎 Add Documents to Chatbot
const addDocumentsToChatbot = async (req, res) => {
  console.log("\n📎 [ADD DOCUMENTS]");
  try {
    const chatbotId = req.params.id;
    const userId = req.user.userId;

    console.log(`🧠 Chatbot: ${chatbotId}, 👤 User: ${userId}`);
    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) {
      console.log("❌ Chatbot not found or not owned by user");
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    if (!req.files || req.files.length === 0) {
      console.log("⚠️ No files uploaded for chatbot:", chatbotId);
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileUrls = [];
    for (const file of req.files) {
      if (!file.location) continue;
      fileUrls.push(file.location);
      console.log(`📎 File uploaded: ${file.location}`);
      await Document.create({ chatbot: chatbot._id, s3Url: file.location });
    }

    console.log(`📡 Sending new files to Flask: ${process.env.FLASK_URL}/process-pdf`);
    await axios.post(`${process.env.FLASK_URL}/process-pdf`, {
      chatbot_id: chatbot._id.toString(),
      file_urls: fileUrls
    });

    console.log("✅ Documents added successfully");
    res.json({ message: 'Documents added successfully' });

  } catch (err) {
    console.error("❌ Error adding documents:", err.message);
    res.status(500).json({ message: 'Failed to add documents' });
  }
};


// 📄 Get Chatbot Documents
const getChatbotDocuments = async (req, res) => {
  console.log("\n📄 [GET DOCUMENTS]");
  try {
    const chatbotId = req.params.id;
    const userId = req.user.userId;
    console.log(`🧠 Chatbot: ${chatbotId}, 👤 User: ${userId}`);

    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) {
      console.log("❌ Chatbot not found for this user");
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    const documents = await Document.find({ chatbot: chatbotId });
    console.log(`✅ Found ${documents.length} documents`);
    res.json(documents);

  } catch (err) {
    console.error("❌ Error fetching documents:", err.message);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};


// 🗑️ Delete Chatbot
const deleteChatbot = async (req, res) => {
  console.log("\n🗑️ [DELETE CHATBOT]");
  try {
    const chatbotId = req.params.id;
    const userId = req.user.userId;
    console.log(`🧠 Chatbot: ${chatbotId}, 👤 User: ${userId}`);

    const chatbot = await Chatbot.findOne({ _id: chatbotId, user: userId });
    if (!chatbot) {
      console.log("❌ Chatbot not found");
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    // 1️⃣ Delete embeddings via Flask
    try {
      console.log(`📡 Requesting Flask to delete embeddings for: ${chatbotId}`);
      await axios.post(`${process.env.FLASK_URL}/delete-embeddings`, { chatbot_id: chatbotId });
    } catch (flaskErr) {
      console.error("⚠️ Flask error deleting embeddings:", flaskErr.message);
    }

    // 2️⃣ Get documents
    const docs = await Document.find({ chatbot: chatbotId });
    console.log(`🗃️ Found ${docs.length} documents for deletion`);

    // 3️⃣ Delete from S3
    for (const doc of docs) {
      try {
        const key = decodeURIComponent(doc.s3Url.split('.amazonaws.com/')[1]);
        await s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: key }).promise();
        console.log(`✅ Deleted file from S3: ${key}`);
      } catch (s3Err) {
        console.error(`❌ S3 deletion failed for ${doc.s3Url}:`, s3Err.message);
      }
    }

    // 4️⃣ Delete records
    await Document.deleteMany({ chatbot: chatbotId });
    await chatbot.deleteOne();
    console.log("✅ Chatbot and documents deleted successfully");

    res.json({ message: 'Chatbot and associated files deleted successfully' });

  } catch (err) {
    console.error("❌ Server error deleting chatbot:", err.message);
    res.status(500).json({ message: 'Server error deleting chatbot' });
  }
};


// 💬 Query Chatbot
const queryChatbot = async (req, res) => {
  console.log("\n💬 [QUERY CHATBOT]");
  try {
    const { chatbot_id, question } = req.body;
    const userId = req.user.userId;

    console.log(`🧠 Chatbot: ${chatbot_id}, 👤 User: ${userId}, ❓ Question: ${question}`);

    const chatbot = await Chatbot.findOne({ _id: chatbot_id, user: userId });
    if (!chatbot) {
      console.log("❌ Chatbot not found or not owned by user");
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    console.log(`📡 Sending query to Flask: ${process.env.FLASK_URL}/query`);
    const flaskResponse = await axios.post(`${process.env.FLASK_URL}/query`, {
      question,
      chatbot_id,
    });

    console.log("✅ Received response from Flask");
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
