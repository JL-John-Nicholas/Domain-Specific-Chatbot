const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  chatbot: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [{
    sender: { type: String, enum: ['user', 'bot'] },
    text: String,
    sources: [String]
  }],
  feedback: {
    thumbsUp: { type: Number, default: 0 },
    thumbsDown: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
