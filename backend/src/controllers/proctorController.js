const ProctorEvent = require('../models/ProctorEvent');
const Session = require('../models/Session');

const EVENT_WEIGHTS = {
  PHONE_DETECTED: 40,
  MULTIPLE_FACES: 30,
  CAMERA_DISABLED: 30,
  CAMERA_BLOCKED: 30,
  FACE_MISSING: 15,
  EXCESSIVE_LOOKING_AWAY: 10,
  TAB_FOCUS_LOST: 10,
  NETWORK_DISCONNECTED: 5,
  SUSPICIOUS_EVENT_BURST: 25,
};

// @desc    Record a proctoring incident / AI detection
// @route   POST /api/v1/proctoring/events
// @access  Private
const recordEvent = async (req, res) => {
  try {
    const { sessionId, eventType, confidence, evidence } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sessionId and eventType',
      });
    }

    const session = await Session.findById(sessionId).populate('exam');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const weight = EVENT_WEIGHTS[eventType] || 10;

    const event = await ProctorEvent.create({
      session: session._id,
      student: session.student,
      exam: session.exam._id,
      eventType,
      riskWeight: weight,
      confidence: confidence !== undefined ? confidence : 1.0,
      evidence: evidence || {},
    });

    // Update cumulative session risk score
    session.riskScore = (session.riskScore || 0) + weight;
    await session.save();

    // Broadcast to examiners via Socket.IO if available
    if (req.io) {
      req.io.to(`session_${session._id}`).emit('proctor:alert', {
        eventId: event._id,
        sessionId: session._id,
        studentId: session.student,
        eventType,
        riskWeight: weight,
        confidence: event.confidence,
        riskScore: session.riskScore,
        timestamp: event.createdAt,
      });

      req.io.to(`session_${session._id}`).emit('risk:update', {
        sessionId: session._id,
        riskScore: session.riskScore,
        updatedAt: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: {
        event,
        currentRiskScore: session.riskScore,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all events for a given session
// @route   GET /api/v1/sessions/:id/events
// @access  Private (Examiner, Admin)
const getSessionEvents = async (req, res) => {
  try {
    const events = await ProctorEvent.find({ session: req.params.id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review/verify a flagged proctoring event
// @route   PATCH /api/v1/proctoring/events/:eventId/review
// @access  Private (Examiner, Admin)
const reviewEvent = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['CONFIRMED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'CONFIRMED' or 'DISMISSED'",
      });
    }

    const event = await ProctorEvent.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.reviewStatus = status;
    event.reviewedBy = req.user._id;
    if (reviewNote) event.reviewNote = reviewNote;

    await event.save();

    res.json({
      success: true,
      message: `Event marked as ${status}`,
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  recordEvent,
  getSessionEvents,
  reviewEvent,
};
