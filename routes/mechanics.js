const express = require('express');
const router = express.Router();
const Mechanic = require('../models/Mechanic');
const Review = require('../models/Review');
const { sanitizeMechanic } = require('../data/helpers');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { state, lga, service, lat, lng, radius, open, q } = req.query;
  const filter = {};

  if (state) filter.state = new RegExp(state, 'i');
  if (lga) filter.lga = new RegExp(lga, 'i');
  if (service) filter.services = new RegExp(service, 'i');
  if (open === 'true') filter.isOpen = true;
  if (q) {
    const query = new RegExp(q, 'i');
    filter.$or = [
      { name: query },
      { address: query },
      { services: query },
      { specialties: query },
    ];
  }

  let mechanics = await Mechanic.find(filter);

  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const maxRadius = radius ? parseFloat(radius) : null;

  let results = mechanics.map((m) => sanitizeMechanic(m, userLat, userLng));

  if (userLat && userLng && maxRadius) results = results.filter((m) => m.distanceKm <= maxRadius);

  if (userLat && userLng) {
    results.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  } else {
    results.sort((a, b) => b.rating - a.rating);
  }

  res.json({ success: true, count: results.length, mechanics: results });
});

router.get('/nearby', async (req, res) => {
  const { lat, lng, limit = 3, availableOnly } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: 'Please provide your lat and lng coordinates.' });

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const filter = availableOnly === 'true' ? { isAvailable: true } : {};
  const mechanics = await Mechanic.find(filter);

  let results = mechanics.map((m) => sanitizeMechanic(m, userLat, userLng));
  results.sort((a, b) => a.distanceKm - b.distanceKm);
  results = results.slice(0, parseInt(limit));

  res.json({ success: true, message: `${results.length} mechanics found close to you`, mechanics: results });
});

router.get('/:id', async (req, res) => {
  const mechanic = await Mechanic.findOne({ id: req.params.id });
  if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });

  const { lat, lng } = req.query;
  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;

  const mechanicReviews = await Review.find({ mechanicId: mechanic.id }).sort({ createdAt: -1 });

  res.json({ success: true, mechanic: sanitizeMechanic(mechanic, userLat, userLng), reviews: mechanicReviews });
});

router.put('/:id', authenticate, requireRole('mechanic'), async (req, res) => {
  const mechanic = await Mechanic.findOne({ id: req.params.id });
  if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });
  if (mechanic.id !== req.user.id) return res.status(403).json({ success: false, message: 'Not allowed to edit this profile.' });

  const allowedFields = ['name', 'ownerName', 'email', 'address', 'state', 'lga', 'lat', 'lng', 'services', 'specialties', 'openHours', 'openDays', 'priceRange', 'yearsExperience'];
  allowedFields.forEach((field) => { if (req.body[field] !== undefined) mechanic[field] = req.body[field]; });

  await mechanic.save();
  res.json({ success: true, message: 'Profile updated!', mechanic: sanitizeMechanic(mechanic) });
});

router.put('/:id/toggle', authenticate, requireRole('mechanic'), async (req, res) => {
  const mechanic = await Mechanic.findOne({ id: req.params.id });
  if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });
  if (mechanic.id !== req.user.id) return res.status(403).json({ success: false, message: 'Not allowed.' });

  mechanic.isOpen = !mechanic.isOpen;
  mechanic.isAvailable = mechanic.isOpen;
  await mechanic.save();

  res.json({ success: true, message: mechanic.isOpen ? '✅ You are now visible to customers' : '🔴 You are now marked as closed', isOpen: mechanic.isOpen });
});

module.exports = router;
