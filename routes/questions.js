
const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { auth, allowRoles } = require('../middlewares/auth');


router.post('/', auth, allowRoles(['teacher']), async (req, res) => {
  try {
    const body = { ...req.body, author: req.user._id };
    
    if (!body.text) return res.status(400).json({ error: 'Question text required' });
    const q = await Question.create(body);
    res.json(q);
  } catch (err) {
    console.error('POST /api/questions error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const qs = await Question.find().lean();
    res.json(qs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
