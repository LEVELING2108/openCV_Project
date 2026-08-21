const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOptionIndex: {
    type: Number,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const sessionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['CREATED', 'ACTIVE', 'SUBMITTED', 'EXPIRED', 'TERMINATED'],
      default: 'CREATED',
    },
    startedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    answers: [answerSchema],
    assignedQuestionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Session', sessionSchema);
