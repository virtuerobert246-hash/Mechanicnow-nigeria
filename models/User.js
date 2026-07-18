const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Keeps a stable string `id` field (instead of switching every route/frontend
// reference over to Mongo's `_id`) so nothing downstream has to change shape.
const userSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: null },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
