const Session = require('../models/Session');
const Exam = require('../models/Exam');

const { generateSessionPDFReport } = require('../services/reportService');

// Utility to shuffle questions
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// @desc    Start or resume a student exam session
// @route   POST /api/v1/exams/:id/sessions
// @access  Private (Student)
const startSession = async (req, res) => {
  try {
    const examId = req.params.id;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check if session already exists for this student & exam
    let session = await Session.findOne({
      exam: examId,
      student: req.user._id,
      status: { $in: ['CREATED', 'ACTIVE'] },
    });

    if (session) {
      return res.json({
        success: true,
        message: 'Resuming existing active session',
        data: session,
      });
    }

    // Determine randomized question order
    let questionIds = exam.questions.map((q) => q._id);
    if (exam.randomizeQuestions) {
      questionIds = shuffleArray(questionIds);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + exam.durationMinutes * 60000);

    session = await Session.create({
      exam: examId,
      student: req.user._id,
      status: 'ACTIVE',
      startedAt: now,
      expiresAt: expiresAt,
      lastHeartbeat: now,
      assignedQuestionOrder: questionIds,
      answers: [],
    });

    res.status(201).json({
      success: true,
      message: 'Exam session started successfully',
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get session details by ID
// @route   GET /api/v1/sessions/:id
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('student', 'name email')
      .populate('exam');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Verify ownership
    if (
      req.user.role === 'student' &&
      session.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this session' });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Session heartbeat & autosave answer update
// @route   POST /api/v1/sessions/:id/heartbeat
// @access  Private (Student)
const sessionHeartbeat = async (req, res) => {
  try {
    const { answers } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Session is ${session.status} and cannot receive heartbeats`,
      });
    }

    // Check expiration
    const now = new Date();
    if (session.expiresAt && now > session.expiresAt) {
      session.status = 'EXPIRED';
      await session.save();
      return res.json({
        success: true,
        message: 'Session has expired',
        data: session,
      });
    }

    session.lastHeartbeat = now;
    if (answers && Array.isArray(answers)) {
      session.answers = answers;
    }

    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        status: session.status,
        lastHeartbeat: session.lastHeartbeat,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit student exam session
// @route   POST /api/v1/sessions/:id/submit
// @access  Private (Student)
const submitSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('exam');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status === 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Session already submitted' });
    }

    const { answers } = req.body;
    if (answers && Array.isArray(answers)) {
      session.answers = answers;
    }

    session.status = 'SUBMITTED';
    session.submittedAt = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate & stream downloadable PDF proctoring audit report
// @route   GET /api/v1/sessions/:id/report/pdf
// @access  Private (Student owner, Examiner, Admin)
const exportSessionReportPDF = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (
      req.user.role === 'student' &&
      session.student.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this report' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ExamGuard_Audit_${session._id}.pdf"`
    );

    await generateSessionPDFReport(req.params.id, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = {
  startSession,
  getSessionById,
  sessionHeartbeat,
  submitSession,
  exportSessionReportPDF,
};
