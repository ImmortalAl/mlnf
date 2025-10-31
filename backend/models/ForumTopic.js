const mongoose = require('mongoose');

const forumTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['General', 'Announcements', 'Help', 'Off-Topic', 'Truths', 'Health', 'Finance'],
    default: 'General'
  },
  pinned: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastReply: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
forumTopicSchema.index({ category: 1, createdAt: -1 });
forumTopicSchema.index({ pinned: -1, createdAt: -1 });
forumTopicSchema.index({ author: 1 });

// Virtual for reply count
forumTopicSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Methods
forumTopicSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

forumTopicSchema.methods.addReply = function(userId, content) {
  this.replies.push({
    user: userId,
    content
  });
  
  this.lastReply = {
    user: userId,
    createdAt: new Date()
  };
  
  return this.save();
};

module.exports = mongoose.model('ForumTopic', forumTopicSchema);
