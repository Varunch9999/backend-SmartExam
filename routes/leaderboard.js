const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');


router.get('/:testId', async (req,res)=>{
  try {
    const testId = req.params.testId;
    const top = await Attempt.find({ test: testId, status: { $in: ['submitted','graded'] } })
      .populate('student','name')
      .sort({ obtainedMarks: -1, date: 1 })
      .limit(20)
      .lean();
    res.json(top);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
