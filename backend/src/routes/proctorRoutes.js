const express = require('express');
const {
  recordEvent,
  reviewEvent,
} = require('../controllers/proctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/events', recordEvent);
router.patch('/events/:eventId/review', authorize('examiner', 'admin'), reviewEvent);

module.exports = router;
