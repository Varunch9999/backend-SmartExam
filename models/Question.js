const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: String,
  isCorrect: { type: Boolean, default: false }
});

const questionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic"
  },
  type: {
    type: String,
    enum: ["mcq", "short", "long", "numeric"],
    default: "mcq"
  },
  text: { type: String, required: true },
  options: [optionSchema], // for mcq
  answer: { type: String }, // for short/numeric
  marks: { type: Number, default: 1 },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Question", questionSchema);
