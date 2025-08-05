const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  domain: { type: String },
  description: { type: String },
  config: {
    temperature: Number,
    style: String,
    disclaimer: String
  },
  status: { type: String, default: 'processing' }  // e.g., processing, ready
}, { timestamps: true });

module.exports = mongoose.model('Chatbot', chatbotSchema);
