      const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const { sanitizeUser, sanitizeMechanic } = require('../data/helpers');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

router.post('/register/user',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').matches(/^(070|080|081|090|091)\d{8}$/).withMessage('Enter a valid Nigerian phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, phone, email, password } = req.body;

    const exists = await User.findOne({ phone });
    if (exists) return res.status(409).json({ success: false, message: 'Phone number already registered.' });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name, phone,
      email: email || null,
      password: hashed,
      role: 'user',
    });

    const token = signToken({ id: newUser.id, role: 'user', name: newUser.name });
    res.status(201).json({ success: true, message: 'Welcome to MechanicNow! 🎉', token, user: sanitizeUser(newUser) });
  }
);

router.post('/register/mechanic',
  [
    body('name').trim().notEmpty().withMessage('Workshop name is required'),
    body('ownerName').trim().notEmpty().withMessage('Your name is required'),
    body('phone').matches(/^(070|080|081|090|091)\d{8}$/).withMessage('Enter a valid Nigerian phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('state').notEmpty().withMessage('State is required'),
    body('lga').notEmpty().withMessage('LGA is required'),
    body('address').notEmpty().withMessage('Workshop address is required'),
    body('lat').isFloat().withMessage('Valid latitude is required'),
    body('lng').isFloat().withMessage('Valid longitude is required'),
    body('services').isArray({ min: 1 }).withMessage('Select at least one service'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, ownerName, phone, email, password, address, state, lga, lat, lng, services, specialties, openHours, openDays, priceRange, yearsExperience } = req.body;

    const exists = await Mechanic.findOne({ phone });
    if (exists) return res.status(409).json({ success: false, message: 'Phone number already registered.' });

    const hashed = await bcrypt.hash(password, 10);

    const newMechanic = await Mechanic.create({
      name, ownerName, phone,
      email: email || null,
      password: hashed,
      role: 'mechanic',
      address, state, lga,
      lat: parseFloat(lat), lng: parseFloat(lng),
      services: services || [], specialties: specialties || [],
      openHours: openHours || '8:00 AM - 6:00 PM',
      openDays: openDays || 'Mon - Sat',
      priceRange: priceRange || null,
      yearsExperience: yearsExperience || 0,
    });

    const token = signToken({ id: newMechanic.id, role: 'mechanic', name: newMechanic.name });
    res.status(201).json({ success: true, message: 'Workshop registered! Customers go soon find you. 🔧', token, mechanic: sanitizeMechanic(newMechanic) });
  }
);

router.post('/login',
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { phone, password } = req.body;

    let account = await User.findOne({ phone });
    let accountType = 'user';
    if (!account) {
      account = await Mechanic.findOne({ phone });
      accountType = 'mechanic';
    }

    const invalid = () => res.status(401).json({ success: false, message: 'Invalid phone number or password.' });

    if (!account) return invalid();

    const match = await bcrypt.compare(password, account.password);
    if (!match) return invalid();

    const token = signToken({ id: account.id, role: accountType, name: account.name });
    const data = accountType === 'mechanic' ? sanitizeMechanic(account) : sanitizeUser(account);
    res.json({ success: true, message: `Welcome back, ${account.name.split(' ')[0]}! 👋`, token, role: accountType, [accountType]: data });
  }
);

module.exports = router;
