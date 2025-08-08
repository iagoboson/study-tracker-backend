const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [1440, 'Duration cannot exceed 24 hours (1440 minutes)']
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [100, 'Subject cannot be more than 100 characters'],
    default: 'General Study'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }],
  isCompleted: {
    type: Boolean,
    default: true
  },
  quality: {
    type: Number,
    min: [1, 'Quality rating must be at least 1'],
    max: [5, 'Quality rating cannot exceed 5'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted duration
studySessionSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
});

// Virtual for date string (YYYY-MM-DD)
studySessionSchema.virtual('dateString').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Indexes for better query performance
studySessionSchema.index({ user: 1, date: -1 });
studySessionSchema.index({ user: 1, date: 1 });
studySessionSchema.index({ date: -1 });

// Static method to get user's study statistics
studySessionSchema.statics.getUserStats = async function(userId, startDate, endDate) {
  const matchStage = {
    user: mongoose.Types.ObjectId(userId)
  };

  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        averageDuration: { $avg: '$duration' },
        averageQuality: { $avg: '$quality' }
      }
    }
  ]);

  return stats[0] || {
    totalSessions: 0,
    totalDuration: 0,
    averageDuration: 0,
    averageQuality: 0
  };
};

// Static method to get user's study streak
studySessionSchema.statics.getUserStreak = async function(userId) {
  const sessions = await this.find({ user: userId })
    .sort({ date: -1 })
    .select('date')
    .lean();

  if (sessions.length === 0) return { currentStreak: 0, maxStreak: 0 };

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let currentDate = new Date();

  // Check if there's a session today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const hasSessionToday = sessions.some(session => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  if (!hasSessionToday) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  for (let i = 0; i < sessions.length; i++) {
    const sessionDate = new Date(sessions[i].date);
    sessionDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      tempStreak++;
      if (i === 0) currentStreak = tempStreak;
    } else {
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 0;
    }
  }

  maxStreak = Math.max(maxStreak, tempStreak);

  return { currentStreak, maxStreak };
};

module.exports = mongoose.model('StudySession', studySessionSchema); 