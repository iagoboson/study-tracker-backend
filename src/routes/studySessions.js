const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createStudySession,
  getStudySessions,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
  getUserStats,
  getStudySessionsByDate
} = require('../controllers/studySessionController');

// All routes are protected
router.use(protect);

// Study session CRUD operations
router.route('/')
  .post(createStudySession)
  .get(getStudySessions);

router.route('/:id')
  .get(getStudySessionById)
  .put(updateStudySession)
  .delete(deleteStudySession);

// Statistics and special queries
router.get('/stats', getUserStats);
router.get('/date/:date', getStudySessionsByDate);

module.exports = router; 