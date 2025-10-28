const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// =======================
// Debug: ENV and Startup
// =======================
console.log("🔧 Loaded environment variables:");
console.log({
  MONGO_URI: process.env.MONGO_URI ? "✅ Present" : "❌ Missing",
  PORT: process.env.PORT,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
});

// =======================
// CORS Configuration
// =======================
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
console.log("🔍 Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    console.log("🌐 Incoming Origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("✅ CORS allowed:", origin);
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(null, false);
    }
  },
  credentials: true,
};

// ❌ FIX: Remove the invalid path '/{*splat}' — use '*' instead
app.use(cors(corsOptions));
app.options('/{*splat}', cors(corsOptions));

// =======================
// Middlewares
// =======================
app.use(express.json());
console.log("⚙️ JSON middleware applied");

// =======================
// Routes
// =======================
try {
  const authRoutes = require('./routes/authRoutes');
  const chatbotRoutes = require('./routes/chatbotRoutes');
  app.use('/api/auth', authRoutes);
  app.use('/api/chatbots', chatbotRoutes);
  console.log("✅ Routes loaded successfully");
} catch (err) {
  console.error("❌ Route loading error:", err);
}

// =======================
// MongoDB Connection
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// =======================
// Test Route
// =======================
app.get('/', (req, res) => {
  console.log("📩 Received request at /");
  res.send('API is working 🚀');
});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
