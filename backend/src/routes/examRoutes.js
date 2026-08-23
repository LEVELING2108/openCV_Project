const express = require('express');
const {
  getExams,
  createExam,
  getExamById,
  updateExam,
  deleteExam,
  assignStudents,
} = require('../controllers/examController');
const { startSession } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getExams)
  .post(authorize('examiner', 'admin'), createExam);

router
  .route('/:id')
  .get(getExamById)
  .patch(authorize('examiner', 'admin'), updateExam)
  .delete(authorize('examiner', 'admin'), deleteExam);

router.post('/:id/assign', authorize('examiner', 'admin'), assignStudents);
router.post('/:id/sessions', authorize('student', 'examiner', 'admin'), startSession);

module.exports = router;
