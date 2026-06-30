require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const mechanicsRoutes = require('./routes/mechanics');
const reviewsRoutes   = require('./routes/reviews');
const usersRoutes     = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Lock CORS to your actual frontend domain(s) only.
// Add more origins to this array if you set up a custom domain later.
const allowedOrigins = [
  'https://clever-cat-571fc2.netlify.app',
  'http://localhost:3000', // keep for local testing only; remove if not needed
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// General rate limiter for all API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Slow down and try again.' },
});
app.use('/api/', limiter);

// Stricter rate limiter specifically for auth endpoints (login/signup)
// to prevent brute-force password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});
app.use('/api/auth', authLimiter);

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
