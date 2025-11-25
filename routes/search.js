const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const { authRequired } = require('../middleware/auth');
const isUser = require("../middleware/isUser");

// Worker by Filter - POST
router.post('/search', authRequired, isUser, async (req, res) => {
  try {
    const {
      type,
      skills,
      rating = {},
      fees = {},
      location = {},
      address = {},
      sort,
      pagination = {}
    } = req.body;

    const filter = { availability: true };

    // Type
    if (type) filter.workerType = type;

    // Skills filter
    if (Array.isArray(skills) && skills.length > 0) {
      filter["skills.name"] = { $in: skills };
    }

    // Rating filter
    if (rating) {
      filter.ratingAvg = { $gte: rating.min ?? 0, $lte: rating.max ?? 5 };
    }

    // Fees filter
    if (fees) {
      filter["skills.hourlyRate"] = { $gte: fees.min ?? 0, $lte: fees.max ?? 999999 };
    }

    // Address filter
    if (address) {
      if (address.state) filter["address.state"] = address.state;
      if (address.district) filter["address.district"] = address.district;
      if (address.tehsil) filter["address.tehsil"] = address.tehsil;
    }

    // Location filter (nearby)
    if (location?.lat && location?.lng) {
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [location.lng, location.lat] },
          $maxDistance: location.radius || 5000
        }
      };
    }

    // Pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Fields to return (projection)
    const projection =
      "name workerType skills.rating skills.hourlyRate ratingAvg experienceYears profilePhoto _id";

    // Sorting
    const sortMap = {
      ratingAsc: { ratingAvg: 1 },
      ratingDesc: { ratingAvg: -1 },
      feesAsc: { "skills.hourlyRate": 1 },
      feesDesc: { "skills.hourlyRate": -1 }
    };

    const query = Worker.find(filter)
      .select(projection)
      .skip(skip)
      .limit(limit);

    if (sort && sortMap[sort]) query.sort(sortMap[sort]);

    // Execute query and count
    const [results, total] = await Promise.all([
      query.exec(),
      Worker.countDocuments(filter)
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// router.post('/workerByFilter', async (req, res) => {
//   try {
//     const {
//       type,
//       skills,
//       rating = {},
//       fees = {},
//       location = {},
//       sort,
//       pagination = {}
//     } = req.body;

//     const filter = { availability: true };

//     // Worker type
//     if (type) filter.workerType = type;

//     // Skills
//     if (Array.isArray(skills) && skills.length > 0) {
//       filter["skills.name"] = { $in: skills };
//     }

//     // Rating filter
//     filter.ratingAvg = {
//       $gte: rating.min ?? 0,
//       $lte: rating.max ?? 5
//     };

//     // Fee filter
//     filter["skills.hourlyRate"] = {
//       $gte: fees.min ?? 0,
//       $lte: fees.max ?? 999999
//     };

//     // Geo filter
//     if (location.lat && location.lng) {
//       filter.location = {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [location.lng, location.lat]
//           },
//           $maxDistance: location.radius || 5000
//         }
//       };
//     }

//     // Pagination
//     const page = pagination.page || 1;
//     const limit = pagination.limit || 10;
//     const skip = (page - 1) * limit;

//     // Only fetch SAFE PUBLIC FIELDS
//     const safeFields = "name workerType skills ratingAvg experienceYears profilePhoto _id";

//     let query = Worker.find(filter)
//       .select(safeFields)
//       .skip(skip)
//       .limit(limit);

//     // Sorting
//     const sortMap = {
//       ratingAsc: { ratingAvg: 1 },
//       ratingDesc: { ratingAvg: -1 },
//       feesAsc: { "skills.hourlyRate": 1 },
//       feesDesc: { "skills.hourlyRate": -1 }
//     };

//     if (sort && sortMap[sort]) query.sort(sortMap[sort]);

//     const results = await query;
//     const total = await Worker.countDocuments(filter);

//     res.json({
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//       results
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// router.get('/nearby', async (req, res) => {
//   try {
//     const { lat, lng, radius = 5000, type } = req.query;

//     if (!lat || !lng) {
//       return res.status(400).json({ error: 'lat and lng required' });
//     }

//     const filter = { availability: true };
//     if (type) filter.workerType = type;

//     // Safe public fields only
//     const safeFields =
//       "name workerType skills ratingAvg experienceYears profilePhoto _id";

//     const workers = await Worker.find({
//       ...filter,
//       location: {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [parseFloat(lng), parseFloat(lat)]
//           },
//           $maxDistance: parseInt(radius)
//         }
//       }
//     }).select(safeFields);

//     res.json(workers);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// router.get('/by-location', async (req, res) => {
//   try {
//     const { state, district, tehsil, type } = req.query;

//     const filter = { availability: true };

//     if (state) filter["address.state"] = state;
//     if (district) filter["address.district"] = district;
//     if (tehsil) filter["address.tehsil"] = tehsil;
//     if (type) filter.workerType = type;

//     // Safe public fields only
//     const safeFields =
//       "name workerType skills ratingAvg experienceYears profilePhoto _id";

//     const workers = await Worker.find(filter).select(safeFields);

//     res.json(workers);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.post('/workerByFilter', async (req, res) => {
//   try {
//     const {
//       type,
//       skills,
//       rating = {},
//       fees = {},
//       location = {},
//       sort,
//       pagination = {}
//     } = req.body;

//     const filter = {
//       availability: true
//     };

//     // Worker type
//     if (type) filter.workerType = type;

//     // Skills
//     if (skills && Array.isArray(skills) && skills.length > 0) {
//       filter["skills.name"] = { $in: skills };
//     }

//     // Rating filter
//     filter.ratingAvg = {
//       $gte: rating.min ?? 0,
//       $lte: rating.max ?? 5
//     };

//     // Fee filter
//     filter["skills.hourlyRate"] = {
//       $gte: fees.min ?? 0,
//       $lte: fees.max ?? 999999
//     };

//     // Geo-filter
//     if (location.lat && location.lng) {
//       filter.location = {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [location.lng, location.lat]
//           },
//           $maxDistance: location.radius || 5000
//         }
//       };
//     }

//     // Pagination
//     const page = pagination.page || 1;
//     const limit = pagination.limit || 10;
//     const skip = (page - 1) * limit;

//     let query = Worker.find(filter)
//       .select("-password")
//       .skip(skip)
//       .limit(limit);

//     // Sorting
//     const sortMap = {
//       ratingAsc: { ratingAvg: 1 },
//       ratingDesc: { ratingAvg: -1 },
//       feesAsc: { "skills.hourlyRate": 1 },
//       feesDesc: { "skills.hourlyRate": -1 }
//     };

//     if (sort && sortMap[sort]) query.sort(sortMap[sort]);

//     const results = await query;
//     const total = await Worker.countDocuments(filter);

//     res.json({
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//       results
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


module.exports = router;
