const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const { authenticate, requireRole } = require('../middleware/auth');
const { sanitizeUser, sanitizeMechanic } = require('../data/helpers');

// NOTE: saved-mechanics tracking is still an in-memory object here, same as
// before — it wasn't part of the original data/db.js arrays. If you want
// this to survive restarts too, it should move into the User document
// (e.g. a `savedMechanicIds: [String]` field) — flag if you want that done
// as a follow-up.
const savedMechanics = {};

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user: sanitizeUser(user) });
});

router.put('/me', authenticate, requireRole('user'), async (req, res) => {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const { name, email } = req.body;

  if (email && email !== user.email) {
    const taken = await User.findOne({ email });
    if (taken) return res.status(409).json({ success: false, message: 'Email already in use.' });
    user.email = email;
  }
  if (name) user.name = name;

  await user.save();
  res.json({ success: true, message: 'Profile updated!', user: sanitizeUser(user) });
});

router.get('/me/saved', authenticate, requireRole('user'), async (req, res) => {
  const saved = savedMechanics[req.user.id] || new Set();
  const mechanics = await Mechanic.find({ id: { $in: [...saved] } });
  res.json({ success: true, count: mechanics.length, mechanics: mechanics.map((m) => sanitizeMechanic(m)) });
});

router.post('/me/saved/:mechanicId', authenticate, requireRole('user'), async (req, res) => {
  const mechanic = await Mechanic.findOne({ id: req.params.mechanicId });
  if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });

  if (!savedMechanics[req.user.id]) savedMechanics[req.user.id] = new Set();
  savedMechanics[req.user.id].add(mechanic.id);
  res.json({ success: true, message: `${mechanic.name} saved! ⭐` });
});

router.delete('/me/saved/:mechanicId', authenticate, requireRole('user'), (req, res) => {
  if (savedMechanics[req.user.id]) {
    savedMechanics[req.user.id].delete(req.params.mechanicId);
  }
  res.json({ success: true, message: 'Removed from saved mechanics.' });
});

module.exports = router;
