const Exam = require('../models/Exam');
const User = require('../models/User');

// @desc    Get all exams (filtered by user role)
// @route   GET /api/v1/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'examiner') {
      query = { creator: req.user._id };
    } else if (req.user.role === 'student') {
      query = {
        $or: [
          { assignedStudents: req.user._id },
          { assignedStudents: { $size: 0 } },
          { assignedStudents: { $exists: false } },
        ],
      };
    }

    const exams = await Exam.find(query)
      .populate('creator', 'name email')
      .populate('assignedStudents', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new exam
// @route   POST /api/v1/exams
// @access  Private (Examiner, Admin)
const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      durationMinutes,
      startTime,
      endTime,
      questions,
      randomizeQuestions,
      assignedStudents,
      proctoringConfig,
    } = req.body;

    if (!title || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Please provide exam title and durationMinutes',
      });
    }

    const now = new Date();
    const defaultEndTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const exam = await Exam.create({
      title,
      description: description || '',
      creator: req.user._id,
      durationMinutes: Number(durationMinutes),
      startTime: startTime || now,
      endTime: endTime || defaultEndTime,
      questions: questions || [],
      randomizeQuestions: randomizeQuestions !== undefined ? randomizeQuestions : true,
      assignedStudents: assignedStudents || [],
      proctoringConfig: proctoringConfig || {},
    });

    res.status(201).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single exam by ID
// @route   GET /api/v1/exams/:id
// @access  Private
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('assignedStudents', 'name email');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // If candidate is a student, sanitize correct answers to prevent inspection leak
    let responseData = exam.toObject();
    if (req.user.role === 'student') {
      responseData.questions = responseData.questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        points: q.points,
        options: q.options.map((opt) => ({
          _id: opt._id,
          text: opt.text,
        })),
      }));
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update exam
// @route   PATCH /api/v1/exams/:id
// @access  Private (Examiner, Admin)
const updateExam = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Make sure user is exam creator or admin
    if (exam.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exam',
      });
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete exam
// @route   DELETE /api/v1/exams/:id
// @access  Private (Examiner, Admin)
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this exam',
      });
    }

    await exam.deleteOne();

    res.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign students to exam
// @route   POST /api/v1/exams/:id/assign
// @access  Private (Examiner, Admin)
const assignStudents = async (req, res) => {
  try {
    const { studentIds, studentEmails } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    let idsToAssign = [...(studentIds || [])];

    if (studentEmails && studentEmails.length > 0) {
      const users = await User.find({ email: { $in: studentEmails }, role: 'student' });
      const foundIds = users.map((u) => u._id.toString());
      idsToAssign = [...new Set([...idsToAssign, ...foundIds])];
    }

    // Merge unique assigned students
    const existing = exam.assignedStudents.map((id) => id.toString());
    const merged = Array.from(new Set([...existing, ...idsToAssign]));

    exam.assignedStudents = merged;
    await exam.save();

    res.json({
      success: true,
      message: `Assigned ${merged.length} students to exam`,
      data: exam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExams,
  createExam,
  getExamById,
  updateExam,
  deleteExam,
  assignStudents,
};
