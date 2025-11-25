const express = require('express');
const { authRequired } = require('../middleware/auth');
const upload = require('../middleware/multer'); // your multer config
const User = require('../models/User');
const Request = require('../models/Request');
const Review = require('../models/Review');
const { deleteCloudinaryImages } = require('../utils/cloudinaryCleanup');

const router = express.Router();

/**
 * GET /user/dashboard
 * User sees all requests they created + basic stats
 */
router.get('/dashboard', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ error: 'Only users can access this dashboard' });

    const requests = await Request.find({ requester: req.user._id })
      .populate('worker', 'name workerType phone')
      .sort({ createdAt: -1 });

    const stats = { total: 0, pending: 0, accepted: 0, resolved: 0, cancelled: 0 };
    requests.forEach((r) => {
      stats.total += 1;
      if (stats[r.status] !== undefined) stats[r.status] += 1;
    });

    res.json({ stats, requests });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PATCH /user/profile
 * Update name or profile photo
 */
router.patch('/profile', authRequired, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ error: 'Only users can update profile' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.name) user.name = req.body.name;

    if (req.file && req.file.path) {
      // Delete old image if exists
      if (user.profilePhoto) await deleteCloudinaryImages(user.profilePhoto);
      user.profilePhoto = req.file.path;
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/**
 * DELETE /user/delete
 * Delete user account + cascade (requests & reviews)
 */
router.delete('/delete', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ error: 'Only users can delete account' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.deleteOne();

    res.json({ message: 'Account and related data deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
