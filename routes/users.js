const express = require('express');
const router = express.Router();
const User = require('../models/User');


router.post('/', async (req, res) => {
  try {
    const u = await User.create(req.body);
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req,res) => {
  try {
    const q = {};
    if (req.query.role) q.role = req.query.role;
    const users = await User.find(q).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req,res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if(!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
