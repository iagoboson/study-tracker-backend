const StudySession = require('../models/StudySession');

// @desc    Create a new study session
// @route   POST /api/study-sessions
// @access  Private
const createStudySession = async (req, res) => {
  try {
    const { date, duration, subject, notes, tags, quality } = req.body;

    const studySession = await StudySession.create({
      user: req.user._id,
      date: date || new Date(),
      duration,
      subject,
      notes,
      tags,
      quality
    });

    res.status(201).json({
      success: true,
      message: 'Study session created successfully',
      data: {
        studySession
      }
    });
  } catch (error) {
    console.error('Create study session error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while creating study session'
    });
  }
};

// @desc    Get all study sessions for a user
// @route   GET /api/study-sessions
// @access  Private
const getStudySessions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      subject,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { user: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const studySessions = await StudySession.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    const total = await StudySession.countDocuments(query);

    res.json({
      success: true,
      data: {
        studySessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get study sessions error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching study sessions'
    });
  }
};

// @desc    Get study session by ID
// @route   GET /api/study-sessions/:id
// @access  Private
const getStudySessionById = async (req, res) => {
  try {
    const studySession = await StudySession.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!studySession) {
      return res.status(404).json({
        error: 'Study session not found',
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      data: {
        studySession
      }
    });
  } catch (error) {
    console.error('Get study session error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching study session'
    });
  }
};

// @desc    Update study session
// @route   PUT /api/study-sessions/:id
// @access  Private
const updateStudySession = async (req, res) => {
  try {
    const { date, duration, subject, notes, tags, quality } = req.body;

    let studySession = await StudySession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!studySession) {
      return res.status(404).json({
        error: 'Study session not found',
        message: 'Study session not found'
      });
    }

    // Update fields
    if (date !== undefined) studySession.date = date;
    if (duration !== undefined) studySession.duration = duration;
    if (subject !== undefined) studySession.subject = subject;
    if (notes !== undefined) studySession.notes = notes;
    if (tags !== undefined) studySession.tags = tags;
    if (quality !== undefined) studySession.quality = quality;

    const updatedStudySession = await studySession.save();

    res.json({
      success: true,
      message: 'Study session updated successfully',
      data: {
        studySession: updatedStudySession
      }
    });
  } catch (error) {
    console.error('Update study session error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while updating study session'
    });
  }
};

// @desc    Delete study session
// @route   DELETE /api/study-sessions/:id
// @access  Private
const deleteStudySession = async (req, res) => {
  try {
    const studySession = await StudySession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!studySession) {
      return res.status(404).json({
        error: 'Study session not found',
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      message: 'Study session deleted successfully'
    });
  } catch (error) {
    console.error('Delete study session error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while deleting study session'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/study-sessions/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get basic stats
    const stats = await StudySession.getUserStats(req.user._id, startDate, endDate);
    
    // Get streak information
    const streak = await StudySession.getUserStreak(req.user._id);

    // Get recent sessions for calendar data
    const recentSessions = await StudySession.find({
      user: req.user._id,
      date: {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
    }).select('date duration');

    // Group sessions by date for calendar
    const sessionsByDate = {};
    recentSessions.forEach(session => {
      const dateStr = session.dateString;
      if (!sessionsByDate[dateStr]) {
        sessionsByDate[dateStr] = 0;
      }
      sessionsByDate[dateStr] += session.duration;
    });

    res.json({
      success: true,
      data: {
        stats: {
          ...stats,
          ...streak
        },
        calendarData: sessionsByDate
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching user statistics'
    });
  }
};

// @desc    Get study sessions by date
// @route   GET /api/study-sessions/date/:date
// @access  Private
const getStudySessionsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const studySessions = await StudySession.find({
      user: req.user._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ createdAt: -1 });

    const totalDuration = studySessions.reduce((sum, session) => sum + session.duration, 0);

    res.json({
      success: true,
      data: {
        studySessions,
        totalDuration,
        sessionCount: studySessions.length
      }
    });
  } catch (error) {
    console.error('Get study sessions by date error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching study sessions'
    });
  }
};

module.exports = {
  createStudySession,
  getStudySessions,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
  getUserStats,
  getStudySessionsByDate
}; 