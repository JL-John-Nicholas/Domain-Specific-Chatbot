const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || '*';
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Middlewares
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/chatbots', chatbotRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Test route
app.get('/', (req, res) => {
  res.send('API is working 🚀');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
