const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    default: ''
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  thumbnail: {
    type: String,
    default: 'default-thumbnail.jpg'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['general', 'tutorial', 'entertainment', 'music', 'gaming', 'news', 'sports', 'education', 'other'],
    default: 'general'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  netScore: {
    type: Number,
    default: 0
  },
  boost: {
    isActive: {
      type: Boolean,
      default: false
    },
    expiresAt: Date,
    boostedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    boostedAt: Date
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isExclusive: {
    type: Boolean,
    default: false
  },
  accessPrice: {
    type: Number,
    default: 200, // Runegold cost for exclusive content
    min: 0
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'copyright', 'misleading', 'violence', 'other'],
      required: true
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'pending', 'flagged', 'removed'],
    default: 'active'
  },
  transcoding: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    hlsPlaylist: String,
    qualities: [{
      resolution: String,
      bitrate: Number,
      url: String
    }]
  },
  subtitles: [{
    language: String,
    languageCode: String,
    url: String,
    isAuto: {
      type: Boolean,
      default: false
    }
  }],
  analytics: {
    avgWatchTime: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    runegoldEarned: {
      type: Number,
      default: 0
    }
  },
  monetization: {
    enabled: {
      type: Boolean,
      default: false
    },
    tipJar: {
      type: Boolean,
      default: true
    },
    totalTips: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
videoSchema.index({ author: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ category: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ netScore: -1 });
videoSchema.index({ views: -1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ 'boost.isActive': 1, 'boost.expiresAt': 1 });
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for vote counts
videoSchema.virtual('upvoteCount').get(function() {
  return this.upvotes ? this.upvotes.length : 0;
});

videoSchema.virtual('downvoteCount').get(function() {
  return this.downvotes ? this.downvotes.length : 0;
});

// Calculate net score before saving
videoSchema.pre('save', function(next) {
  this.netScore = (this.upvotes ? this.upvotes.length : 0) - (this.downvotes ? this.downvotes.length : 0);
  next();
});

// Method to handle voting
videoSchema.methods.vote = async function(userId, voteType) {
  const userIdStr = userId.toString();

  // Remove existing vote
  this.upvotes = this.upvotes.filter(v => v.user.toString() !== userIdStr);
  this.downvotes = this.downvotes.filter(v => v.user.toString() !== userIdStr);

  // Add new vote
  if (voteType === 'upvote') {
    this.upvotes.push({ user: userId });
  } else if (voteType === 'downvote') {
    this.downvotes.push({ user: userId });
  }

  // Recalculate net score
  this.netScore = this.upvotes.length - this.downvotes.length;

  return this.save();
};

// Method to boost video
videoSchema.methods.applyBoost = async function(userId, hours = 1) {
  this.boost = {
    isActive: true,
    expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    boostedBy: userId,
    boostedAt: new Date()
  };
  return this.save();
};

// Method to check if boost is active
videoSchema.methods.isBoostActive = function() {
  return this.boost.isActive && this.boost.expiresAt > new Date();
};

// Method to increment view count
videoSchema.methods.incrementView = async function(userId) {
  this.views += 1;

  if (userId && !this.uniqueViewers.includes(userId)) {
    this.uniqueViewers.push(userId);
  }

  return this.save();
};

// Method to report video
videoSchema.methods.reportVideo = async function(reporterId, reason, description) {
  // Check if user has already reported
  const existingReport = this.reports.find(
    r => r.reporter.toString() === reporterId.toString() && r.status === 'pending'
  );

  if (existingReport) {
    throw new Error('You have already reported this video');
  }

  this.reports.push({
    reporter: reporterId,
    reason,
    description,
    status: 'pending'
  });

  this.reportCount = this.reports.filter(r => r.status === 'pending').length;

  // Auto-flag if too many reports
  if (this.reportCount >= 10) {
    this.status = 'flagged';
  }

  return this.save();
};

// Method to check access
videoSchema.methods.canAccess = function(userId) {
  if (!this.isExclusive) return true;
  if (this.author.toString() === userId.toString()) return true;
  return this.allowedUsers.some(u => u.toString() === userId.toString());
};

// Method to grant access
videoSchema.methods.grantAccess = async function(userId) {
  if (!this.allowedUsers.includes(userId)) {
    this.allowedUsers.push(userId);
    return this.save();
  }
  return this;
};

// Static method to get boosted videos
videoSchema.statics.getBoostedVideos = function() {
  return this.find({
    'boost.isActive': true,
    'boost.expiresAt': { $gt: new Date() },
    status: 'active'
  })
  .sort({ 'boost.boostedAt': -1 })
  .populate('author', 'username avatar');
};

// Static method to expire boosts
videoSchema.statics.expireBoosts = async function() {
  return this.updateMany(
    {
      'boost.isActive': true,
      'boost.expiresAt': { $lte: new Date() }
    },
    {
      $set: { 'boost.isActive': false }
    }
  );
};

// Clean up when deleting
videoSchema.pre('remove', async function(next) {
  // Remove all comments associated with this video
  await mongoose.model('Comment').deleteMany({ video: this._id });
  next();
});

module.exports = mongoose.model('Video', videoSchema);