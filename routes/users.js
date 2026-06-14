const express = require('express');
const router = express.Router();
const { users, mechanics, sanitizeUser, sanitizeMechanic } = require('../data/db');
const { authenticate, requireRole } = require('../middleware/auth');

const savedMechanics = {};

router.get('/me', authenticate, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user: sanitizeUser(user) });
});

router.put('/me', authenticate, requireRole('user'), (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;

  res.json({ success: true, message: 'Profile updated!', user: sanitizeUser(user) });
});

router.get('/me/saved', authenticate, requireRole('user'), (req, res) => {
  const saved = savedMechanics[req.user.id] || new Set();
  const results = mechanics
    .filter((m) => saved.has(m.id))
    .map((m) => sanitizeMechanic(m));

  res.json({ success: true, count: results.length, mechanics: results });
});

router.post('/me/saved/:mechanicId', authenticate, requireRole('user'), (req, res) => {
  const mechanic = mechanics.find((m) => m.id === req.params.mechanicId);
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
