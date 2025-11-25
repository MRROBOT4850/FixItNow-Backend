const express = require('express');
const Request = require('../models/Request');
const Worker = require('../models/Worker');   // <-- add this line
const { authRequired } = require('../middleware/auth');


const router = express.Router();

/**
 * GET /worker/dashboard
 * Worker sees:
 * - counts by status
 * - list of relevant requests
 */
// router.get('/dashboard', authRequired, async (req, res) => {
//   try {
//     if (req.user.role !== 'worker')
//       return res.status(403).json({ error: 'Only workers can access this dashboard' });

//     // 1. Worker’s location to find new nearby requests (within 5 km)
//     const worker = req.user;
//     const radius = 5000; // meters
//     const locationFilter = {
//       location: {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: worker.location.coordinates,
//           },
//           $maxDistance: radius,
//         },
//       },
//     };

//     // 2. Fetch requests near worker OR assigned to worker
//     const requests = await Request.find({
//       $or: [{ worker: worker._id }, locationFilter],
//     })
//       .populate('requester', 'name phone') // only phone shown when accepted
//       .sort({ createdAt: -1 });

//     // 3. Calculate dashboard statistics
//     const stats = {
//       total: 0,
//       pending: 0,
//       accepted: 0,
//       resolved: 0,
//       cancelled: 0,
//     };

//     const visibleRequests = requests.map((r) => {
//       stats.total += 1;
//       if (stats[r.status] !== undefined) stats[r.status] += 1;

//       const showPhone = r.worker && String(r.worker) === String(worker._id);
//       return {
//         id: r._id,
//         type: r.type,
//         description: r.description,
//         status: r.status,
//         photos: r.photos,
//         requester: {
//           name: r.requester?.name,
//           phone: showPhone ? r.requester?.phone : null,
//         },
//         address: r.address,
//         createdAt: r.createdAt,
//       };
//     });

//     res.json({ stats, requests: visibleRequests });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });
router.get('/dashboard', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can access this dashboard' });

    const worker = await Worker.findById(req.user._id);
    if (!worker || !worker.location?.coordinates)
      return res.status(400).json({ error: 'Worker location not set' });

    const radius = 5000; // meters

    // 1. Get nearby requests
    const nearbyRequests = await Request.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: worker.location.coordinates,
          },
          $maxDistance: radius,
        },
      },
      status: 'pending',
    })
      .populate('requester', 'name phone')
      .sort({ createdAt: -1 });

    // 2. Get requests assigned to worker
    const assignedRequests = await Request.find({ worker: worker._id })
      .populate('requester', 'name phone')
      .sort({ createdAt: -1 });

    // 3. Merge and deduplicate requests
    const allRequests = [...assignedRequests, ...nearbyRequests.filter(
      r => !assignedRequests.some(a => String(a._id) === String(r._id))
    )];

    // 4. Stats
    const stats = { total: 0, pending: 0, accepted: 0, resolved: 0, cancelled: 0 };

    const visibleRequests = allRequests.map(r => {
      stats.total += 1;
      if (stats[r.status] !== undefined) stats[r.status] += 1;

      const showPhone = r.worker && String(r.worker) === String(worker._id);
      return {
        id: r._id,
        type: r.type,
        description: r.description,
        status: r.status,
        photos: r.photos,
        requester: {
          name: r.requester?.name,
          phone: showPhone ? r.requester?.phone : null,
        },
        address: r.address,
        createdAt: r.createdAt,
      };
    });

    res.json({ stats, requests: visibleRequests });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/delete', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can delete their account' });

    const worker = await Worker.findById(req.user._id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    await worker.deleteOne(); // triggers schema hook

    res.json({
      message:
        'Worker account deleted. Requests preserved with "Deleted Worker" placeholder.',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
