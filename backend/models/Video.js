const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  timestamp: {
    type: Number,
    min: 0,
    default: null
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  highlightedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  highlightedAt: Date,
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Reply cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
});

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    enum: ['Truths', 'Rebels', 'General'],
    required: true
  }],
  category: {
    type: String,
    enum: ['Documentary', 'News', 'Opinion', 'Educational', 'Entertainment', 'Other'],
    default: 'Other'
  },
  views: {
    type: Number,
    default: 0
  },
  uniqueViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  netScore: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  isBoosted: {
    type: Boolean,
    default: false
  },
  boostedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  boostedAt: Date,
  boostExpiresAt: Date,
  isExclusive: {
    type: Boolean,
    default: false
  },
  exclusivePrice: {
    type: Number,
    default: 200
  },
  exclusiveViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'copyright', 'misinformation', 'harassment', 'other'],
      required: true
    },
    details: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String
  }],
  metadata: {
    resolution: String,
    fps: Number,
    codec: String,
    bitrate: Number,
    aspectRatio: String
  },
  subtitles: [{
    language: {
      type: String,
      required: true
    },
    url: String,
    fileId: mongoose.Schema.Types.ObjectId
  }],
  relatedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  playlist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  },
  monetization: {
    enabled: {
      type: Boolean,
      default: false
    },
    runegoldEarned: {
      type: Number,
      default: 0
    },
    tipsReceived: [{
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      message: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  analytics: {
    watchTime: {
      type: Number,
      default: 0
    },
    avgWatchDuration: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    dailyViews: [{
      date: Date,
      count: Number
    }]
  },
  status: {
    type: String,
    enum: ['processing', 'active', 'flagged', 'removed', 'archived'],
    default: 'processing'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  publishedAt: Date,
  featuredAt: Date,
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
videoSchema.index({ uploader: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ netScore: -1 });
videoSchema.index({ views: -1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ isBoosted: 1, boostExpiresAt: 1 });
videoSchema.index({ status: 1 });

// Virtual for engagement score
videoSchema.virtual('engagementScore').get(function() {
  const upvoteCount = this.upvotes?.length || 0;
  const downvoteCount = this.downvotes?.length || 0;
  const totalVotes = upvoteCount + downvoteCount;
  const commentCount = this.comments ? this.comments.filter(c => !c.isDeleted).length : 0;
  return (totalVotes * 2) + (commentCount * 3) + ((this.views || 0) * 0.1);
});

// Pre-save middleware to calculate net score
videoSchema.pre('save', function(next) {
  this.netScore = this.upvotes.length - this.downvotes.length;
  
  // Check and expire boost if needed
  if (this.isBoosted && this.boostExpiresAt && this.boostExpiresAt < new Date()) {
    this.isBoosted = false;
    this.boostedBy = undefined;
    this.boostedAt = undefined;
    this.boostExpiresAt = undefined;
  }
  
  // Calculate engagement rate
  if (this.views > 0) {
    const totalEngagements = this.upvotes.length + this.downvotes.length + this.comments.length;
    this.analytics.engagementRate = (totalEngagements / this.views) * 100;
  }
  
  next();
});

// Method to add view
videoSchema.methods.addView = async function(userId) {
  this.views++;
  
  if (userId && !this.uniqueViewers.includes(userId)) {
    this.uniqueViewers.push(userId);
  }
  
  // Update daily views
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStats = this.analytics.dailyViews.find(
    dv => dv.date.getTime() === today.getTime()
  );
  
  if (todayStats) {
    todayStats.count++;
  } else {
    this.analytics.dailyViews.push({ date: today, count: 1 });
    
    // Keep only last 30 days
    if (this.analytics.dailyViews.length > 30) {
      this.analytics.dailyViews = this.analytics.dailyViews.slice(-30);
    }
  }
  
  await this.save();
};

// Method to toggle vote
videoSchema.methods.toggleVote = async function(userId, voteType) {
  const userIdStr = userId.toString();
  const upvoteIndex = this.upvotes.findIndex(id => id.toString() === userIdStr);
  const downvoteIndex = this.downvotes.findIndex(id => id.toString() === userIdStr);
  
  let action = null;
  
  if (voteType === 'upvote') {
    if (upvoteIndex > -1) {
      // Remove upvote
      this.upvotes.splice(upvoteIndex, 1);
      action = 'removed_upvote';
    } else {
      // Add upvote and remove downvote if exists
      if (downvoteIndex > -1) {
        this.downvotes.splice(downvoteIndex, 1);
      }
      this.upvotes.push(userId);
      action = 'upvoted';
    }
  } else if (voteType === 'downvote') {
    if (downvoteIndex > -1) {
      // Remove downvote
      this.downvotes.splice(downvoteIndex, 1);
      action = 'removed_downvote';
    } else {
      // Add downvote and remove upvote if exists
      if (upvoteIndex > -1) {
        this.upvotes.splice(upvoteIndex, 1);
      }
      this.downvotes.push(userId);
      action = 'downvoted';
    }
  }
  
  this.netScore = this.upvotes.length - this.downvotes.length;
  await this.save();
  
  return {
    action,
    upvotes: this.upvotes.length,
    downvotes: this.downvotes.length,
    netScore: this.netScore
  };
};

// Method to add comment
videoSchema.methods.addComment = async function(userId, content, timestamp = null) {
  const comment = {
    user: userId,
    content,
    timestamp
  };
  
  this.comments.push(comment);
  await this.save();
  
  return this.comments[this.comments.length - 1];
};

// Method to highlight comment
videoSchema.methods.highlightComment = async function(commentId, userId) {
  const comment = this.comments.id(commentId);
  
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (comment.isHighlighted) {
    throw new Error('Comment is already highlighted');
  }
  
  comment.isHighlighted = true;
  comment.highlightedBy = userId;
  comment.highlightedAt = new Date();
  
  await this.save();
  return comment;
};

// Method to boost video
videoSchema.methods.boostVideo = async function(userId, hours = 1) {
  if (this.isBoosted && this.boostExpiresAt > new Date()) {
    throw new Error('Video is already boosted');
  }
  
  this.isBoosted = true;
  this.boostedBy = userId;
  this.boostedAt = new Date();
  this.boostExpiresAt = new Date(Date.now() + (hours * 60 * 60 * 1000));
  
  await this.save();
  
  return {
    boostedAt: this.boostedAt,
    boostExpiresAt: this.boostExpiresAt
  };
};

// Method to check if user has access
videoSchema.methods.hasAccess = function(userId) {
  if (!this.isExclusive || !this.isPublic) {
    return true;
  }
  
  if (this.uploader.toString() === userId.toString()) {
    return true;
  }
  
  return this.exclusiveViewers.some(
    viewer => viewer.toString() === userId.toString()
  );
};

// Ensure virtual fields are included in JSON
videoSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;