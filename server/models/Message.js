const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  room: { type: String, required: true }, // Can be conversationId or 'global'
  isGlobal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 21600 } // 21600 seconds = 6 hours
});

// TTL index is handled by the 'expires' property in schema
// MongoDB will automatically delete documents where current time > createdAt + 21600 seconds

module.exports = mongoose.model('Message', messageSchema);
