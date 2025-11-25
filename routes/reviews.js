const express = require('express');
const Review = require('../models/Review');
const Request = require('../models/Request');
const Worker = require('../models/Worker');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /reviews/:requestId
 * Only users can review after request is resolved
 */
router.post('/:requestId', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ error: 'Only users can submit reviews' });

    const { rating, text } = req.body;
    const { requestId } = req.params;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (String(request.requester) !== String(req.user._id))
      return res.status(403).json({ error: 'You did not create this request' });
    if (request.status !== 'resolved')
      return res.status(400).json({ error: 'Request not resolved yet' });
    if (!request.worker)
      return res.status(400).json({ error: 'No worker assigned to request' });

    // prevent duplicate review
    const existing = await Review.findOne({ author: req.user._id, request: requestId });
    if (existing) return res.status(400).json({ error: 'Review already exists' });

    const review = await Review.create({
      author: req.user._id,
      worker: request.worker,
      request: requestId,
      rating,
      text,
    });

    // update worker average and count
    const stats = await Review.aggregate([
      { $match: { worker: request.worker } },
      { $group: { _id: '$worker', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Worker.findByIdAndUpdate(request.worker, {
        ratingAvg: stats[0].avg,
        reviewsCount: stats[0].count,
      });
    }

    res.status(201).json(review);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /reviews/worker/:workerId
 * Public endpoint to view all reviews for a worker
 */
router.get('/worker/:workerId', async (req, res) => {
  try {
    const reviews = await Review.find({ worker: req.params.workerId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.delete('/:reviewId', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ error: 'Only users can delete reviews' });

    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    if (String(review.author) !== String(req.user._id))
      return res.status(403).json({ error: 'You cannot delete this review' });

    // Store worker ID before deletion for recalculation
    const workerId = review.worker;

    await review.deleteOne();

    // Recalculate worker rating stats
    const stats = await Review.aggregate([
      { $match: { worker: workerId } },
      { $group: { _id: '$worker', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Worker.findByIdAndUpdate(workerId, {
        ratingAvg: stats[0].avg,
        reviewsCount: stats[0].count,
      });
    } else {
      // No remaining reviews — reset stats
      await Worker.findByIdAndUpdate(workerId, {
        ratingAvg: 0,
        reviewsCount: 0,
      });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
