const { auth, allowRoles } = require('../middlewares/auth');
const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');

// Create topic
router.post('/', auth, allowRoles(['teacher']), async (req, res) => {
  try {
    const topic = await Topic.create(req.body);
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.course) q.course = req.query.course;
    const topics = await Topic.find(q).populate('course', 'title');
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single topic
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate('course', 'title');
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update topic
router.put('/:id', async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete topic
router.delete('/:id', async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
