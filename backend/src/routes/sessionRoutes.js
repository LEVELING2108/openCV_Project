const express = require('express');
const {
  getSessionById,
  sessionHeartbeat,
  submitSession,
  exportSessionReportPDF,
} = require('../controllers/sessionController');
const { getSessionEvents } = require('../controllers/proctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/:id', getSessionById);
router.get('/:id/report/pdf', exportSessionReportPDF);
router.post('/:id/heartbeat', sessionHeartbeat);
router.post('/:id/submit', submitSession);
router.get('/:id/events', authorize('examiner', 'admin'), getSessionEvents);

module.exports = router;
