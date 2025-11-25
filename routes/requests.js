const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const Request = require('../models/Request');
const Worker = require('../models/Worker');
const { authRequired } = require('../middleware/auth');
const geocoder = require('../config/geocoder');

const router = express.Router();
const upload = multer({ storage });

/**
 * Create a new service request
 * Accessible to logged-in users only
 */
router.post('/', authRequired, upload.array('photos', 5), async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ error: 'Only users can create requests' });

    const { type, description, state, district, tehsil, useCurrentLocation, location } = req.body;
    console.log("uplaod request aa gyi hai")
    let coordinates = [0, 0];

    // 1. If browser sent coordinates (frontend captured GPS)
    if (useCurrentLocation && location && Array.isArray(location.coordinates)) {
      coordinates = location.coordinates;
    } 
    // 2. If user wants to reuse their saved DB location
    else if (useCurrentLocation === 'saved') {
      const user = await User.findById(req.user._id);
      if (user && user.location && Array.isArray(user.location.coordinates)) {
        coordinates = user.location.coordinates;
      }
    } 
    // 3. Otherwise, geocode manually entered text location
    else if (state && district && tehsil) {
      const addressString = `${tehsil}, ${district}, ${state}`;
      const geoData = await geocoder.geocode(addressString);
      if (geoData.length && geoData[0].longitude && geoData[0].latitude) {
        coordinates = [geoData[0].longitude, geoData[0].latitude];
      }
    }

    // Cloudinary URLs
    const photoUrls = req.files.map((f) => f.path);

    const newRequest = new Request({
      requester: req.user._id,
      type,
      description,
      photos: photoUrls,
      address: { state, district, tehsil },
      location: { type: 'Point', coordinates },
      status: 'pending'
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/**
 * Worker accepts a request
 */
router.post('/:id/accept', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can accept requests' });

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.status !== 'pending')
      return res.status(400).json({ error: 'Request already accepted or resolved' });

    request.worker = req.user._id;
    request.status = 'accepted';
    await request.save();

    res.json(request);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Worker marks a request as resolved
 */
router.post('/:id/resolve', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can resolve requests' });

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (String(request.worker) !== String(req.user._id))
      return res.status(403).json({ error: 'You did not accept this request' });

    request.status = 'resolved';
    await request.save();

    // update worker solved count
    await Worker.findByIdAndUpdate(req.user._id, { $inc: { solvedCount: 1 } });

    res.json(request);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get dashboard stats for current user or worker
 */
router.get('/dashboard', authRequired, async (req, res) => {
  try {
    const filter =
      req.user.role === 'worker'
        ? { worker: req.user._id }
        : { requester: req.user._id };

    const requests = await Request.find(filter);
    const stats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      accepted: requests.filter((r) => r.status === 'accepted').length,
      resolved: requests.filter((r) => r.status === 'resolved').length,
    };

    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /user/request/:id
 * User deletes a request they created
 */
router.delete('/request/:id', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ error: 'Only users can delete requests' });

    const request = await Request.findOne({ _id: req.params.id, requester: req.user._id });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    await request.deleteOne();
    res.json({ message: 'Request deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
