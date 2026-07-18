  const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Mechanic = require('../models/Mechanic');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/:mechanicId', async (req, res) => {
  const mechReviews = await Review.find({ mechanicId: req.params.mechanicId }).sort({ createdAt: -1 });
  res.json({ success: true, count: mechReviews.length, reviews: mechReviews });
});

router.post('/:mechanicId', authenticate, requireRole('user'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const mechanic = await Mechanic.findOne({ id: req.params.mechanicId });
    if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });

    const alreadyReviewed = await Review.findOne({ mechanicId: req.params.mechanicId, userId: req.user.id });
    if (alreadyReviewed) return res.status(409).json({ success: false, message: 'You have already reviewed this mechanic.' });

    const newReview = await Review.create({
      mechanicId: req.params.mechanicId,
      userId: req.user.id,
      userName: req.user.name,
      rating: parseInt(req.body.rating),
      comment: req.body.comment,
    });

    const mechReviews = await Review.find({ mechanicId: mechanic.id });
    const avg = mechReviews.reduce((sum, r) => sum + r.rating, 0) / mechReviews.length;
    mechanic.rating = parseFloat(avg.toFixed(1));
    mechanic.reviewCount = mechReviews.length;
    await mechanic.save();

    res.status(201).json({ success: true, message: 'Review posted! Thank you for helping others find good mechanics. 🙏', review: newReview });
  }
);

router.delete('/:id', authenticate, requireRole('user'), async (req, res) => {
  const removed = await Review.findOneAndDelete({ id: req.params.id, userId: req.user.id });
  if (!removed) return res.status(404).json({ success: false, message: 'Review not found.' });

  const mechanic = await Mechanic.findOne({ id: removed.mechanicId });
  if (mechanic) {
    const mechReviews = await Review.find({ mechanicId: mechanic.id });
    mechanic.reviewCount = mechReviews.length;
    mechanic.rating = mechReviews.length > 0
      ? parseFloat((mechReviews.reduce((s, r) => s + r.rating, 0) / mechReviews.length).toFixed(1))
      : 0;
    await mechanic.save();
  }

  res.json({ success: true, message: 'Review deleted.' });
});

module.exports = router;
