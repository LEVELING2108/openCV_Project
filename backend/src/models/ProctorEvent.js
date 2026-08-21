const mongoose = require('mongoose');

const proctorEventSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        'FACE_MISSING',
        'MULTIPLE_FACES',
        'PHONE_DETECTED',
        'CAMERA_DISABLED',
        'CAMERA_BLOCKED',
        'EXCESSIVE_LOOKING_AWAY',
        'TAB_FOCUS_LOST',
        'NETWORK_DISCONNECTED',
        'SUSPICIOUS_EVENT_BURST',
      ],
      required: true,
    },
    riskWeight: {
      type: Number,
      required: true,
      default: 10,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    evidence: {
      snapshotUrl: { type: String, default: null },
      details: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    reviewStatus: {
      type: String,
      enum: ['UNREVIEWED', 'CONFIRMED', 'DISMISSED'],
      default: 'UNREVIEWED',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProctorEvent', proctorEventSchema);
