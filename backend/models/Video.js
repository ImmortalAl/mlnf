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
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // GridFS file ID
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
    type: Number, // Duration in seconds
    default: 0
  },
  thumbnail: {
    type: String,
    default: '/assets/images/default-thumbnail.jpg'
  },
  tags: [{
    type: String,
    enum: ['Truths', 'Rebels', 'General'],
    required: true
  }],
  views: {
    type: Number,
    default: 0
  },
  votes: {
    up: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    down: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  netScore: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    timestamp: {
      type: Number, // Video timestamp in seconds
      default: null
    },
    isHighlighted: {
      type: Boolean,
      default: false
    },
    highlightExpiry: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
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
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'misleading', 'copyright', 'other'],
      required: true
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  hlsPlaylist: {
    type: String // Path to HLS playlist file
  },
  subtitles: [{
    language: String,
    label: String,
    file: String // Path to subtitle file
  }],
  analytics: {
    totalWatchTime: {
      type: Number,
      default: 0
    },
    avgWatchPercentage: {
      type: Number,
      default: 0
    },
    uniqueViewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingError: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  monetization: {
    isMonetized: {
      type: Boolean,
      default: false
    },
    runegoldEarned: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
videoSchema.index({ uploadedBy: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ netScore: -1 });
videoSchema.index({ 'boost.isActive': 1, 'boost.expiresAt': 1 });
videoSchema.index({ views: -1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ title: 'text', description: 'text' });

// Virtual for vote counts
videoSchema.virtual('upvoteCount').get(function() {
  return this.votes.up.length;
});

videoSchema.virtual('downvoteCount').get(function() {
  return this.votes.down.length;
});

// Virtual for comment count
videoSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Calculate net score before saving
videoSchema.pre('save', function(next) {
  this.netScore = this.votes.up.length - this.votes.down.length;
  next();
});

// Method to check if user has voted
videoSchema.methods.getUserVote = function(userId) {
  const hasUpvoted = this.votes.up.some(vote => vote.user.toString() === userId.toString());
  const hasDownvoted = this.votes.down.some(vote => vote.user.toString() === userId.toString());
  
  if (hasUpvoted) return 'up';
  if (hasDownvoted) return 'down';
  return null;
};

// Method to add or update vote
videoSchema.methods.vote = async function(userId, voteType) {
  // Remove any existing vote
  this.votes.up = this.votes.up.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.down = this.votes.down.filter(vote => vote.user.toString() !== userId.toString());
  
  // Add new vote if not removing
  if (voteType === 'up') {
    this.votes.up.push({ user: userId });
  } else if (voteType === 'down') {
    this.votes.down.push({ user: userId });
  }
  
  return this.save();
};

// Method to add comment
videoSchema.methods.addComment = async function(userId, text, timestamp = null) {
  const comment = {
    user: userId,
    text,
    timestamp
  };
  
  this.comments.push(comment);
  return this.save();
};

// Method to highlight comment
videoSchema.methods.highlightComment = async function(commentId) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.isHighlighted = true;
    comment.highlightExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return this.save();
  }
  throw new Error('Comment not found');
};

// Method to boost video
videoSchema.methods.boostVideo = async function(userId) {
  this.boost = {
    isActive: true,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    boostedBy: userId,
    boostedAt: new Date()
  };
  return this.save();
};

// Method to check and update boost status
videoSchema.methods.checkBoostStatus = function() {
  if (this.boost.isActive && this.boost.expiresAt < new Date()) {
    this.boost.isActive = false;
    return true; // Boost expired
  }
  return false;
};

// Method to increment views
videoSchema.methods.incrementViews = async function(userId = null) {
  this.views += 1;
  
  if (userId && !this.analytics.uniqueViewers.includes(userId)) {
    this.analytics.uniqueViewers.push(userId);
  }
  
  return this.save();
};

// Method to update watch analytics
videoSchema.methods.updateWatchAnalytics = async function(userId, watchDuration) {
  this.analytics.totalWatchTime += watchDuration;
  
  if (this.duration > 0) {
    const watchPercentage = (watchDuration / this.duration) * 100;
    const currentTotal = this.analytics.avgWatchPercentage * (this.views - 1);
    this.analytics.avgWatchPercentage = (currentTotal + watchPercentage) / this.views;
  }
  
  return this.save();
};

// Ensure virtuals are included in JSON
videoSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

// Middleware to check expired boosts
videoSchema.pre('find', function() {
  // Automatically filter out inactive videos unless explicitly requested
  if (!this.getQuery().includeInactive) {
    this.where({ isActive: true });
  }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
