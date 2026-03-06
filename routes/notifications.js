const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { auth, requireAuth } = require("../middlewares/auth");


router.get("/", auth, requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/:id/read", auth, requireAuth, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (String(notif.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    notif.read = true;
    await notif.save();

    res.json({ notification: notif });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/read-all", auth, requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
