const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  points: {
    type: Number,
    default: 1,
  },
});

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Exam duration in minutes is required'],
      min: 1,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    questions: [questionSchema],
    randomizeQuestions: {
      type: Boolean,
      default: true,
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    proctoringConfig: {
      faceMissingPersistenceSeconds: { type: Number, default: 5 },
      phoneDetectionConfidenceThreshold: { type: Number, default: 0.5 },
      trackTabFocus: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Exam', examSchema);
