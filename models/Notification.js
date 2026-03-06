const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: { type: String, required: true }, 
  

  message: { type: String },

  link: { type: String },

  read: { type: Boolean, default: false },

 
  data: {
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" }
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);