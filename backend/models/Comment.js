const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  timestamp: {
    type: Number, // Video timestamp in seconds for timestamp links
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
  netScore: {
    type: Number,
    default: 0
  },
  highlight: {
    isActive: {
      type: Boolean,
      default: false
    },
    expiresAt: Date,
    highlightedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    highlightedAt: Date
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['visible', 'hidden', 'deleted', 'flagged'],
    default: 'visible'
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

// Indexes
commentSchema.index({ video: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'highlight.isActive': 1, 'highlight.expiresAt': 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ netScore: -1 });

// Virtual for vote counts
commentSchema.virtual('upvoteCount').get(function() {
  return this.upvotes ? this.upvotes.length : 0;
});

commentSchema.virtual('downvoteCount').get(function() {
  return this.downvotes ? this.downvotes.length : 0;
});

// Calculate net score before saving
commentSchema.pre('save', function(next) {
  this.netScore = (this.upvotes ? this.upvotes.length : 0) - (this.downvotes ? this.downvotes.length : 0);
  next();
});

// Method to vote on comment
commentSchema.methods.vote = async function(userId, voteType) {
  const userIdStr = userId.toString();

  // Remove existing vote
  this.upvotes = this.upvotes.filter(id => id.toString() !== userIdStr);
  this.downvotes = this.downvotes.filter(id => id.toString() !== userIdStr);

  // Add new vote
  if (voteType === 'upvote') {
    this.upvotes.push(userId);
  } else if (voteType === 'downvote') {
    this.downvotes.push(userId);
  }

  // Recalculate net score
  this.netScore = this.upvotes.length - this.downvotes.length;

  return this.save();
};

// Method to highlight comment
commentSchema.methods.applyHighlight = async function(userId, hours = 24) {
  this.highlight = {
    isActive: true,
    expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    highlightedBy: userId,
    highlightedAt: new Date()
  };
  return this.save();
};

// Method to check if highlight is active
commentSchema.methods.isHighlightActive = function() {
  return this.highlight.isActive && this.highlight.expiresAt > new Date();
};

// Method to edit comment
commentSchema.methods.editComment = async function(newContent) {
  // Save current content to history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });

  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();

  return this.save();
};

// Method to add reply
commentSchema.methods.addReply = async function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
    return this.save();
  }
  return this;
};

// Method to extract mentions from content
commentSchema.methods.extractMentions = async function() {
  const mentionPattern = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionPattern.exec(this.content)) !== null) {
    const username = match[1];
    const User = mongoose.model('User');
    const user = await User.findOne({ username });

    if (user) {
      mentions.push(user._id);
    }
  }

  this.mentions = mentions;
  return mentions;
};

// Static method to get highlighted comments
commentSchema.statics.getHighlightedComments = function(videoId) {
  return this.find({
    video: videoId,
    'highlight.isActive': true,
    'highlight.expiresAt': { $gt: new Date() },
    status: 'visible'
  })
  .sort({ 'highlight.highlightedAt': -1 })
  .populate('author', 'username avatar badges');
};

// Static method to expire highlights
commentSchema.statics.expireHighlights = async function() {
  return this.updateMany(
    {
      'highlight.isActive': true,
      'highlight.expiresAt': { $lte: new Date() }
    },
    {
      $set: { 'highlight.isActive': false }
    }
  );
};

// Method to format timestamp as link
commentSchema.methods.getTimestampLink = function() {
  if (this.timestamp !== null && this.timestamp !== undefined) {
    const minutes = Math.floor(this.timestamp / 60);
    const seconds = this.timestamp % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return null;
};

// Clean up replies when deleting
commentSchema.pre('remove', async function(next) {
  // Remove this comment from parent's replies array
  if (this.parentComment) {
    await this.constructor.findByIdAndUpdate(
      this.parentComment,
      { $pull: { replies: this._id } }
    );
  }

  // Delete all child replies
  await this.constructor.deleteMany({ parentComment: this._id });

  next();
});

module.exports = mongoose.model('Comment', commentSchema);