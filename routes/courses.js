
const express = require('express');
const router = express.Router();

const Course = require('../models/Course');
const Topic = require('../models/Topic');
const Test = require('../models/Test');
const Enrollment = require('../models/Enrollment');

const { auth, allowRoles } = require('../middlewares/auth');


router.post('/', auth, allowRoles(['teacher']), async (req, res) => {
  try {
    const { title, public: isPublic = true } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const course = await Course.create({
      title,
      public: isPublic,
      teacher: req.user._id
    });

    res.json(course);
  } catch (err) {
    console.error('POST /api/courses error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/', auth, async (req, res) => {
  try {
    let courses;

    if (req.user.role === 'teacher') {
      // teacher sees own courses
      courses = await Course.find({ teacher: req.user._id })
        .populate('teacher', 'name email')
        .lean();
    } else {
      // student sees ALL courses
      courses = await Course.find()
        .populate('teacher', 'name email')
        .lean();
    }

    res.json(courses);
  } catch (err) {
    console.error('GET /api/courses error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .lean();

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    
    if (req.user.role === 'student' && !course.public) {
      const enrolled = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
        status: 'enrolled'
      });

      if (!enrolled) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const topics = await Topic.find({ course: course._id }).lean();
    const tests = await Test.find({ course: course._id })
  .populate('topic', 'title')
  .lean();


    course.topics = topics;
    course.tests = tests;

    res.json(course);
  } catch (err) {
    console.error('GET /api/courses/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.post('/:courseId/topics', auth, allowRoles(['teacher']), async (req, res) => {
  try {
    const { title } = req.body;
    const { courseId } = req.params;

    if (!title) {
      return res.status(400).json({ error: 'Topic title required' });
    }

    const course = await Course.findOne({
      _id: courseId,
      teacher: req.user._id
    });

    if (!course) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const topic = await Topic.create({
      title,
      course: courseId
    });

    res.json(topic);
  } catch (err) {
    console.error('Create topic error:', err);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});


router.post('/:courseId/tests', auth, allowRoles(['teacher']), async (req, res) => {
  try {
    const { title, topic } = req.body;
    const { courseId } = req.params;

    if (!title) {
      return res.status(400).json({ error: 'Test title required' });
    }

    const course = await Course.findOne({
      _id: courseId,
      teacher: req.user._id
    });

    if (!course) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    if (topic) {
      const topicExists = await Topic.findOne({
        _id: topic,
        course: courseId
      });

      if (!topicExists) {
        return res.status(400).json({ error: 'Invalid topic' });
      }
    }

    const test = await Test.create({
      title,
      course: courseId,
      topic: topic || null,
      creator: req.user._id
    });

    res.json(test);
  } catch (err) {
    console.error('Create test error:', err);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

module.exports = router;
