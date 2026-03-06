const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },

    
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate topic names inside same course
topicSchema.index({ course: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("Topic", topicSchema);
