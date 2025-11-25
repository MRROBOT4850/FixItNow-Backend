const express = require('express');
const Worker = require('../models/Worker');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/worker/skills
 * Add or update worker skill with hourly rate
 */
router.post('/', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can manage skills' });

    const { name, hourlyRate } = req.body;

    if (!name || !hourlyRate)
      return res.status(400).json({ error: 'Skill name and hourly rate required' });

    const worker = await Worker.findById(req.user._id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const existingSkill = worker.skills.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSkill) {
      existingSkill.hourlyRate = hourlyRate;
    } else {
      worker.skills.push({ name, hourlyRate });
    }

    await worker.save();
    res.json({ message: 'Skill updated successfully', skills: worker.skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/worker/skills/:name
 * Remove a specific skill by name
 */
router.delete('/:name', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can delete skills' });

    const worker = await Worker.findById(req.user._id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const index = worker.skills.findIndex(
      (s) => s.name.toLowerCase() === req.params.name.toLowerCase()
    );
    if (index === -1)
      return res.status(404).json({ error: 'Skill not found' });

    worker.skills.splice(index, 1);
    await worker.save();

    res.json({ message: 'Skill removed', skills: worker.skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/worker/skills
 * View all worker skills and current availability
 */
router.get('/', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can view their skills' });

    const worker = await Worker.findById(req.user._id).select('skills availability');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    res.json({
      availability: worker.availability,
      skills: worker.skills,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/worker/availability
 * Toggle worker availability (true or false)
 */
router.patch('/availability', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'worker')
      return res.status(403).json({ error: 'Only workers can update availability' });

    const { availability } = req.body;
    if (typeof availability !== 'boolean')
      return res.status(400).json({ error: 'Availability must be boolean' });

    const worker = await Worker.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true }
    ).select('availability');

    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    res.json({
      message: 'Availability updated',
      availability: worker.availability,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
