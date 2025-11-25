// const express = require('express');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const geocoder = require('../config/geocoder');
// const User = require('../models/User');
// const Worker = require('../models/Worker');

// const router = express.Router();
// const secret = process.env.JWT_SECRET;
// const SALT_ROUNDS = 10;

// // Signup route (user or worker)
// router.post('/signup', async (req, res) => {
//   const { name, email, password, role, phone, workerType, state, district, tehsil, experienceYears } = req.body;
//   if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

//   const existing = await (role === 'worker' ? Worker : User).findOne({ email });
//   if (existing) return res.status(400).json({ error: 'Email already in use' });

//   const hash = await bcrypt.hash(password, SALT_ROUNDS);

//   // Geocode location text
//   const addressString = `${tehsil}, ${district}, ${state}`;
//   const geoData = await geocoder.geocode(addressString);
//   const coordinates = geoData.length ? [geoData[0].longitude, geoData[0].latitude] : [0, 0];

//   const baseData = {
//     name, email, passwordHash: hash, phone,
//     address: { state, district, tehsil },
//     location: { type: 'Point', coordinates },
//   };

//   let user;
//   if (role === 'worker') {
//     user = new Worker({ ...baseData, role: 'worker', workerType, experienceYears });
//   } else {
//     user = new User({ ...baseData, role: 'user' });
//   }

//   await user.save();

//   const token = jwt.sign({ id: user._id }, secret, { expiresIn: '30d' });
//   res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
// });

// // Login
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   let user = await User.findOne({ email });
//   if (!user) user = await Worker.findOne({ email });
//   if (!user) return res.status(400).json({ error: 'Invalid credentials' });

//   const valid = await bcrypt.compare(password, user.passwordHash);
//   if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

//   const token = jwt.sign({ id: user._id }, secret, { expiresIn: '30d' });
//   res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
// });

// module.exports = router;
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const geocoder = require('../config/geocoder');
const User = require('../models/User');
const Worker = require('../models/Worker');

const router = express.Router();
const secret = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const {
      name, email, password, role, phone,
      workerType, state, district, tehsil,
      experienceYears, location // optional: { type: 'Point', coordinates: [lng, lat] }
    } = req.body;

    if (!['user', 'worker'].includes(role))
      return res.status(400).json({ error: 'Role must be user or worker' });
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const existing = await (role === 'worker' ? Worker : User).findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Determine coordinates
    let coordinates = [0, 0];
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      // Browser provided geolocation
      coordinates = location.coordinates;
    } else if (state && district && tehsil) {
      // Fallback to text-based geocoding
      const addressString = `${tehsil}, ${district}, ${state}`;
      try {
        const geoData = await geocoder.geocode(addressString);
        if (geoData.length && geoData[0].longitude && geoData[0].latitude)
          coordinates = [geoData[0].longitude, geoData[0].latitude];
      } catch (err) {
        console.error('Geocoding failed:', err.message);
      }
    }

    const baseData = {
      name,
      email,
      password: hash,
      phone,
      address: { state, district, tehsil },
      location: { type: 'Point', coordinates },
    };

    const user =
      role === 'worker'
        ? new Worker({ ...baseData, workerType, experienceYears, role: 'worker' })
        : new User({ ...baseData, role: 'user' });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("login request "+email +password)
    let user = await User.findOne({ email });
    if (!user) user = await Worker.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
