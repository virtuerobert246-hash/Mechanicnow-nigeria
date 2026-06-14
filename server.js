require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const mechanicsRoutes = require('./routes/mechanics');
const reviewsRoutes   = require('./routes/reviews');
const usersRoutes     = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Slow down and try again.' },
});
app.use('/api/', limiter);

app.use('/api/auth',      authRoutes);
app.use('/api/mechanics', mechanicsRoutes);
app.use('/api/reviews',   reviewsRoutes);
app.use('/api/users',     usersRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'MechanicNow Nigeria API 🔧🇳🇬',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth:      '/api/auth',
      mechanics: '/api/mechanics',
      reviews:   '/api/reviews',
      users:     '/api/users',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again.',
  });
});

app.listen(PORT, () => {
  console.log(`MechanicNow Nigeria API running on port ${PORT} 🔧🇳🇬`);
});

module.exports = app;
