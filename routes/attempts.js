const express = require("express");
const router = express.Router();

const Attempt = require("../models/Attempt");
const Test = require("../models/Test");
const Question = require("../models/Question");
const { auth, requireAuth } = require("../middlewares/auth");


router.get("/my", auth, requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const attempts = await Attempt.find({ student: req.user._id })
      .populate("test", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", auth, requireAuth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate("student", "name email")
      .populate({
        path: "test",
        populate: {
          path: "questions.question",
          model: "Question"
        }
      });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    
    if (
      req.user.role === "student" &&
      String(attempt.student._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    
    if (req.user.role === "teacher") {
      const test = await Test.findById(attempt.test._id).select("creator");
      if (String(test.creator) !== String(req.user._id)) {
        return res.status(403).json({ error: "Not your test" });
      }
    }

    res.json({ attempt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/", auth, requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { testId } = req.query;
    const query = {};
    if (testId) query.test = testId;

    let attempts = await Attempt.find(query)
      .populate("student", "name email")
      .populate("test", "title creator")
      .sort({ createdAt: -1 })
      .lean();

    
    attempts = attempts.filter(
      a => String(a.test.creator) === String(req.user._id)
    );

    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/:id/grade", auth, requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { obtainedMarks, feedback } = req.body;

    const attempt = await Attempt.findById(req.params.id)
      .populate("test", "creator")
      .exec();

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    if (String(attempt.test.creator) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not your test" });
    }

    attempt.obtainedMarks = obtainedMarks;
    attempt.status = "graded";
    attempt.feedback = feedback || "";

    await attempt.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
