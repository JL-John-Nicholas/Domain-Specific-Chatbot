const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  chatbot: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true },
  s3Url: { type: String, required: true },
  chunkCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
