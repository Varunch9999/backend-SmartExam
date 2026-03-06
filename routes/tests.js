const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Parser } = require("json2csv");

const Test = require("../models/Test");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Notification = require("../models/Notification");

const { auth, allowRoles } = require("../middlewares/auth");


router.post("/", auth, allowRoles(["teacher"]), async (req, res) => {
  try {
    const { title, duration, course, topic, questions } = req.body;

    if (!title || !course || !questions || questions.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const courseDoc = await Course.findOne({
      _id: course,
      teacher: req.user._id
    });

    if (!courseDoc) {
      return res.status(403).json({ error: "Not your course" });
    }

    const test = await Test.create({
      title,
      duration: duration || 30,
      course,
      topic: topic || null,
      questions,
      creator: req.user._id
    });

    res.status(201).json(test);
  } catch (err) {
    console.error("Create test error:", err);
    res.status(500).json({ error: "Failed to create test" });
  }
});


router.get("/", auth, async (req, res) => {
  try {
    // ---------- TEACHER ----------
    if (req.user.role === "teacher") {
      const tests = await Test.find({ creator: req.user._id })
        .populate("course", "title")
        .populate("topic", "title")
        .lean();

      return res.json(tests);
    }

    // ---------- STUDENT ----------
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: "enrolled"
    }).select("course");

    const enrolledCourseIds = enrollments.map(e => e.course.toString());

    const publicCourses = await Course.find({ public: true }).select("_id");
    const publicCourseIds = publicCourses.map(c => c._id.toString());

    const allowedCourseIds = [
      ...new Set([...enrolledCourseIds, ...publicCourseIds])
    ];

    const tests = await Test.find({
      course: { $in: allowedCourseIds }
    })
      .populate("course", "title")
      .populate("topic", "title")
      .lean();

    res.json(tests);
  } catch (err) {
    console.error("GET /tests error:", err);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});


router.get("/:id", auth, async (req, res) => {
  try {
    const testId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ error: "Invalid test id" });
    }

    const test = await Test.findById(testId)
      .populate("course", "title public")
      .populate("topic", "title")
      .populate({
        path: "questions.question",
        model: "Question"
      })
      .lean();

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

   
    if (req.user.role === "student" && !test.course.public) {
      const enrolled = await Enrollment.findOne({
        course: test.course._id,
        student: req.user._id,
        status: "enrolled"
      });

      if (!enrolled) {
        return res.status(403).json({ error: "Not enrolled in course" });
      }
    }

  
    if (req.user.role === "teacher") {
      if (String(test.creator) !== String(req.user._id)) {
        return res.status(403).json({ error: "Not your test" });
      }
    }

    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/:id/submit", auth, allowRoles(["student"]), async (req, res) => {
  try {
    const { answers = {} } = req.body;

    const test = await Test.findById(req.params.id)
      .populate("course", "public")
      .populate({
        path: "questions.question",
        model: "Question"
      });

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

  
    const existingAttempt = await Attempt.findOne({
      student: req.user._id,
      test: test._id,
      status: "submitted"
    });

    if (existingAttempt) {
      return res.status(400).json({
        message: "You have already attempted this test"
      });
    }

   
    if (!test.course.public) {
      const enrolled = await Enrollment.findOne({
        course: test.course._id,
        student: req.user._id,
        status: "enrolled"
      });

      if (!enrolled) {
        return res.status(403).json({ error: "Not enrolled in course" });
      }
    }

    let totalMarks = 0;
    let obtainedMarks = 0;

    for (const qItem of test.questions) {
      const q = qItem.question;
      const marks = qItem.marks || 1;
      totalMarks += marks;

      const provided = answers[q._id];

      if (q.type === "mcq") {
        const correct = q.options.find(o => o.isCorrect);
        if (correct && String(provided) === String(correct._id)) {
          obtainedMarks += marks;
        }
      } else {
        if (
          provided !== undefined &&
          String(provided).trim().toLowerCase() ===
            String(q.answer).trim().toLowerCase()
        ) {
          obtainedMarks += marks;
        }
      }
    }

    const attempt = await Attempt.create({
      student: req.user._id,
      test: test._id,
      answers,
      obtainedMarks,
      totalMarks,
      status: "submitted"
    });

    await Notification.create({
      user: test.creator,
      type: "attempt_submitted",
      message: "A student submitted a test",
      link: `/teacher/results`
    });

    res.json({
      obtainedMarks,
      totalMarks,
      attemptId: attempt._id
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Submission failed" });
  }
});


router.get(
  "/attempts/:testId",
  auth,
  allowRoles(["student"]),
  async (req, res) => {
    try {
      const attempt = await Attempt.findOne({
        student: req.user._id,
        test: req.params.testId,
        status: "submitted"
      }).populate("test", "title");

      if (!attempt) {
        return res.status(404).json({ error: "No attempt found" });
      }

      res.json({
        testTitle: attempt.test.title,
        obtainedMarks: attempt.obtainedMarks,
        totalMarks: attempt.totalMarks,
        date: attempt.createdAt
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch result" });
    }
  }
);


router.get("/:id/export", auth, allowRoles(["teacher"]), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test || String(test.creator) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not your test" });
    }

    const attempts = await Attempt.find({ test: test._id })
      .populate("student", "name email")
      .lean();

    const data = attempts.map(a => ({
      student: a.student?.name,
      email: a.student?.email,
      obtained: a.obtainedMarks,
      total: a.totalMarks,
      status: a.status,
      date: a.date
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment(`test-${test._id}-results.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", auth, allowRoles(["teacher"]), async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id
    });

    if (!test) {
      return res.status(404).json({ error: "Test not found or not owner" });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
