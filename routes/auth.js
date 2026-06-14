const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { users, mechanics, uuidv4, sanitizeUser, sanitizeMechanic } = require('../data/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mechanicnow_super_secret_key';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

router.post('/register/user',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').matches(/^(070|080|081|090|091)\d{8}$/).withMessage('Enter a valid Nigerian phone number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, phone, email, password } = req.body;
    const exists = users.find((u) => u.phone === phone);
    if (exists) return res.status(409).json({ success: false, message: 'Phone number already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(), name, phone,
      email: email || null,
      password: hashed, role: 'user',
      createdAt: new Date(),
    };

    users.push(newUser);
    const token = signToken({ id: newUser.id, role: 'user', name: newUser.name });
    res.status(201).json({ success: true, message: 'Welcome to MechanicNow! 🎉', token, user: sanitizeUser(newUser) });
  }
);

router.post('/register/mechanic',
  [
    body('name').trim().notEmpty().withMessage('Workshop name is required'),
    body('ownerName').trim().notEmpty().withMessage('Your name is required'),
    body('phone').matches(/^(070|080|081|090|091)\d{8}$/).withMessage('Enter a valid Nigerian phone number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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
    const exists = mechanics.find((m) => m.phone === phone);
    if (exists) return res.status(409).json({ success: false, message: 'Phone number already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const newMechanic = {
      id: uuidv4(), name, ownerName, phone,
      email: email || null, password: hashed, role: 'mechanic',
      address, state, lga,
      lat: parseFloat(lat), lng: parseFloat(lng),
      services: services || [], specialties: specialties || [],
      rating: 0, reviewCount: 0, isOpen: false,
      openHours: openHours || '8:00 AM - 6:00 PM',
      openDays: openDays || 'Mon - Sat',
      profileImage: null, workshopImages: [],
      isVerified: false, isAvailable: true,
      priceRange: priceRange || null,
      yearsExperience: yearsExperience || 0,
      createdAt: new Date(),
    };

    mechanics.push(newMechanic);
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
    let account = users.find((u) => u.phone === phone);
    let accountType = 'user';

    if (!account) { account = mechanics.find((m) => m.phone === phone); accountType = 'mechanic'; }
    if (!account) return res.status(401).json({ success: false, message: 'Phone number not found.' });

    const match = await bcrypt.compare(password, account.password);
    if (!match) return res.status(401).json({ success: false, message: 'Wrong password. Try again.' });

    const token = signToken({ id: account.id, role: accountType, name: account.name });
    const data = accountType === 'mechanic' ? sanitizeMechanic(account) : sanitizeUser(account);

    res.json({ success: true, message: `Welcome back, ${account.name.split(' ')[0]}! 👋`, token, role: accountType, [accountType]: data });
  }
);

module.exports = router;
