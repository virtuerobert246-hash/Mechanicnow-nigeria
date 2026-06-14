const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { reviews, mechanics, uuidv4 } = require('../data/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/:mechanicId', (req, res) => {
  const mechReviews = reviews
    .filter((r) => r.mechanicId === req.params.mechanicId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, count: mechReviews.length, reviews: mechReviews });
});

router.post('/:mechanicId', authenticate, requireRole('user'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const mechanic = mechanics.find((m) => m.id === req.params.mechanicId);
    if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });

    const alreadyReviewed = reviews.find((r) => r.mechanicId === req.params.mechanicId && r.userId === req.user.id);
    if (alreadyReviewed) return res.status(409).json({ success: false, message: 'You have already reviewed this mechanic.' });

    const newReview = {
      id: uuidv4(),
      mechanicId: req.params.mechanicId,
      userId: req.user.id,
      userName: req.user.name,
      rating: parseInt(req.body.rating),
      comment: req.body.comment,
      createdAt: new Date(),
    };

    reviews.push(newReview);

    const mechReviews = reviews.filter((r) => r.mechanicId === mechanic.id);
    const avg = mechReviews.reduce((sum, r) => sum + r.rating, 0) / mechReviews.length;
    mechanic.rating = parseFloat(avg.toFixed(1));
    mechanic.reviewCount = mechReviews.length;

    res.status(201).json({ success: true, message: 'Review posted! Thank you for helping others find good mechanics. 🙏', review: newReview });
  }
);

router.delete('/:id', authenticate, requireRole('user'), (req, res) => {
  const idx = reviews.findIndex((r) => r.id === req.params.id && r.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found.' });

  const [removed] = reviews.splice(idx, 1);
  const mechanic = mechanics.find((m) => m.id === removed.mechanicId);
  if (mechanic) {
    const mechReviews = reviews.filter((r) => r.mechanicId === mechanic.id);
    mechanic.reviewCount = mechReviews.length;
    mechanic.rating = mechReviews.length > 0
      ? parseFloat((mechReviews.reduce((s, r) => s + r.rating, 0) / mechReviews.length).toFixed(1))
      : 0;
  }

  res.json({ success: true, message: 'Review deleted.' });
});

module.exports = router;
