const express = require('express');
const router = express.Router();
const { mechanics, reviews, getDistanceKm, sanitizeMechanic } = require('../data/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', (req, res) => {
  let results = [...mechanics];
  const { state, lga, service, lat, lng, radius, open, q } = req.query;

  if (state) results = results.filter((m) => m.state.toLowerCase().includes(state.toLowerCase()));
  if (lga) results = results.filter((m) => m.lga.toLowerCase().includes(lga.toLowerCase()));
  if (service) results = results.filter((m) => m.services.some((s) => s.toLowerCase().includes(service.toLowerCase())));
  if (open === 'true') results = results.filter((m) => m.isOpen === true);
  if (q) {
    const query = q.toLowerCase();
    results = results.filter((m) =>
      m.name.toLowerCase().includes(query) ||
      m.address.toLowerCase().includes(query) ||
      m.services.some((s) => s.toLowerCase().includes(query)) ||
      m.specialties.some((s) => s.toLowerCase().includes(query))
    );
  }

  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const maxRadius = radius ? parseFloat(radius) : null;

  results = results.map((m) => sanitizeMechanic(m, userLat, userLng));
  if (userLat && userLng && maxRadius) results = results.filter((m) => m.distanceKm <= maxRadius);
  if (userLat && userLng) {
    results.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  } else {
    results.sort((a, b) => b.rating - a.rating);
  }

  res.json({ success: true, count: results.length, mechanics: results });
});

router.get('/nearby', (req, res) => {
  const { lat, lng, limit = 3, availableOnly } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: 'Please provide your lat and lng coordinates.' });

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  let results = mechanics.map((m) => sanitizeMechanic(m, userLat, userLng));

  if (availableOnly === 'true') results = results.filter((m) => m.isAvailable === true);
  results.sort((a, b) => a.distanceKm - b.distanceKm);
  results = results.slice(0, parseInt(limit));

  res.json({ success: true, message: `${results.length} mechanics found close to you`, mechanics: results });
});

router.get('/:id', (req, res) => {
  const mechanic = mechanics.find((m) => m.id === req.params.id);
  if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });

  const { lat, lng } = req.query;
  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const mechanicReviews = reviews.filter((r) => r.mechanicId === mechanic.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, mechanic: sanitizeMechanic(mechanic, userLat, userLng), reviews: mechanicReviews });
});

router.put('/:id', authenticate, requireRole('mechanic'), (req, res) => {
  const mechanic = mechanics.find((m) => m.id === req.params.id);
  if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });
  if (mechanic.id !== req.user.id) return res.status(403).json({ success: false, message: 'Not allowed to edit this profile.' });

  const allowedFields = ['name', 'ownerName', 'email', 'address', 'state', 'lga', 'lat', 'lng', 'services', 'specialties', 'openHours', 'openDays', 'priceRange', 'yearsExperience'];
  allowedFields.forEach((field) => { if (req.body[field] !== undefined) mechanic[field] = req.body[field]; });

  res.json({ success: true, message: 'Profile updated!', mechanic: sanitizeMechanic(mechanic) });
});

router.put('/:id/toggle', authenticate, requireRole('mechanic'), (req, res) => {
  const mechanic = mechanics.find((m) => m.id === req.params.id);
  if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });
  if (mechanic.id !== req.user.id) return res.status(403).json({ success: false, message: 'Not allowed.' });

  mechanic.isOpen = !mechanic.isOpen;
  mechanic.isAvailable = mechanic.isOpen;

  res.json({ success: true, message: mechanic.isOpen ? '✅ You are now visible to customers' : '🔴 You are now marked as closed', isOpen: mechanic.isOpen });
});

module.exports = router;
