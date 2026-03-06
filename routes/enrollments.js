const express = require('express');
const router = express.Router();

const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

const { auth, allowRoles } = require('../middlewares/auth');


router.post('/courses/:courseId/join', auth, allowRoles(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const existing = await Enrollment.findOne({
      course: courseId,
      student: req.user._id
    });

    if (existing) {
      return res.json({ enrollment: existing });
    }

    if (course.public) {
      const enrollment = await Enrollment.create({
        course: courseId,
        student: req.user._id,
        status: 'enrolled',
        decidedAt: new Date(),
        decidedBy: course.teacher
      });

      await Notification.create({
        user: course.teacher,
        type: 'student_enrolled',
        message: `${req.user.name || "A student"} joined your course`,
        link: `/teacher/courses/${courseId}`
      });

      return res.json({ enrollment });
    }

   
const enrollment = await Enrollment.create({
  course: courseId,
  student: req.user._id,
  status: 'pending'
});

await Notification.create({
  user: course.teacher,
  type: 'join_request',
  message: `${req.user.name || "A student"} requested to join your course`,
  data: { enrollmentId: enrollment._id }   
});

    res.json({ enrollment });

  } catch (err) {
    console.error('Join course error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.post('/:id/approve', auth, allowRoles(['teacher']), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course');

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    enrollment.status = 'enrolled';
    enrollment.decidedAt = new Date();
    enrollment.decidedBy = req.user._id;

    await enrollment.save();

   
    await Notification.deleteMany({
      type: "join_request",
      "data.enrollmentId": enrollment._id
    });

    await Notification.create({
      user: enrollment.student,
      type: 'join_approved',
      message: 'Your course request was approved',
      link: `/courses/${enrollment.course._id}`
    });

    res.json({ enrollment });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/:id/reject', auth, allowRoles(['teacher']), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course');

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    enrollment.status = 'rejected';
    enrollment.decidedAt = new Date();
    enrollment.decidedBy = req.user._id;

    await enrollment.save();

   
    await Notification.deleteMany({
      type: "join_request",
      "data.enrollmentId": enrollment._id
    });

    await Notification.create({
      user: enrollment.student,
      type: 'join_rejected',
      message: 'Your course request was rejected',
      link: '/courses'
    });

    res.json({ enrollment });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/my', auth, allowRoles(['student']), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id
    })
      .populate('course')
      .lean();

    res.json({ enrollments });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;