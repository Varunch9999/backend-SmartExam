const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  answers: { type: Object, default: {} },
  obtainedMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  auto: { type: Boolean, default: false },
  status: { type: String, enum: ['in_progress','submitted','graded'], default: 'submitted' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attempt", attemptSchema);
