const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum.replies',
    default: null
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const forumThreadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['war_council', 'healing_hall', 'trading_post', 'rune_chamber', 'shield_wall', 'saga_hall'],
    default: 'saga_hall'
  },
  pinned: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [replySchema],
  views: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
forumThreadSchema.index({ category: 1, lastActivity: -1 });
forumThreadSchema.index({ author: 1, createdAt: -1 });
forumThreadSchema.index({ pinned: -1, lastActivity: -1 });

// Virtual for reply count
forumThreadSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Virtual for vote score
forumThreadSchema.virtual('voteScore').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Update lastActivity when thread is modified
forumThreadSchema.pre('save', function(next) {
  if (this.isModified('replies')) {
    this.lastActivity = new Date();
  }
  next();
});

const Forum = mongoose.model('Forum', forumThreadSchema);

module.exports = Forum;
