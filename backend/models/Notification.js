const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'comment',
      'reply',
      'mention',
      'follow',
      'upvote',
      'downvote',
      'message',
      'video_boost',
      'comment_highlight',
      'runegold_received',
      'runegold_spent',
      'badge_earned',
      'video_featured',
      'contest_win',
      'subscription_renewal',
      'system',
      'admin'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  link: {
    type: String
  },
  relatedItem: {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedItem.itemType'
    },
    itemType: {
      type: String,
      enum: ['Video', 'Comment', 'User', 'Blog', 'News', 'Message']
    }
  },
  metadata: {
    runegoldAmount: Number,
    badgeName: String,
    videoTitle: String,
    commentContent: String,
    contestName: String,
    actionUrl: String
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  seen: {
    type: Boolean,
    default: false
  },
  seenAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  sound: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, seen: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Method to mark as seen
notificationSchema.methods.markAsSeen = async function() {
  if (!this.seen) {
    this.seen = true;
    this.seenAt = new Date();
    return this.save();
  }
  return this;
};

// Method to delete notification
notificationSchema.methods.deleteNotification = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  // Generate title and message based on type
  const notification = {
    recipient: data.recipient,
    sender: data.sender,
    type: data.type,
    relatedItem: data.relatedItem,
    metadata: data.metadata || {},
    priority: data.priority || 'medium',
    sound: data.sound !== undefined ? data.sound : true
  };

  // Generate default titles and messages based on type
  switch (data.type) {
    case 'comment':
      notification.title = 'New Comment';
      notification.message = data.message || `${data.senderName || 'Someone'} commented on your video`;
      break;
    case 'reply':
      notification.title = 'New Reply';
      notification.message = data.message || `${data.senderName || 'Someone'} replied to your comment`;
      break;
    case 'mention':
      notification.title = 'You were mentioned';
      notification.message = data.message || `${data.senderName || 'Someone'} mentioned you in a comment`;
      break;
    case 'follow':
      notification.title = 'New Follower';
      notification.message = data.message || `${data.senderName || 'Someone'} started following you`;
      break;
    case 'upvote':
      notification.title = 'New Upvote';
      notification.message = data.message || `Your ${data.itemType || 'content'} received an upvote`;
      break;
    case 'runegold_received':
      notification.title = 'Runegold Received';
      notification.message = data.message || `You received ${data.metadata?.runegoldAmount || 0} Runegold`;
      notification.priority = 'high';
      break;
    case 'badge_earned':
      notification.title = 'Badge Earned!';
      notification.message = data.message || `You earned the ${data.metadata?.badgeName || 'new'} badge`;
      notification.priority = 'high';
      break;
    case 'contest_win':
      notification.title = 'Contest Winner!';
      notification.message = data.message || 'Congratulations! You won the contest';
      notification.priority = 'high';
      break;
    case 'system':
      notification.title = data.title || 'System Notification';
      notification.message = data.message || 'System update';
      break;
    case 'admin':
      notification.title = data.title || 'Admin Message';
      notification.message = data.message || 'Message from administrator';
      notification.priority = 'high';
      break;
    default:
      notification.title = data.title || 'Notification';
      notification.message = data.message || 'You have a new notification';
  }

  // Override with custom title/message if provided
  if (data.title) notification.title = data.title;
  if (data.message) notification.message = data.message;
  if (data.link) notification.link = data.link;
  if (data.expiresAt) notification.expiresAt = data.expiresAt;

  return this.create(notification);
};

// Static method to get unread notifications
notificationSchema.statics.getUnread = function(userId, limit = 50) {
  return this.find({
    recipient: userId,
    read: false,
    isDeleted: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender', 'username avatar')
  .populate('relatedItem.itemId');
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false,
    isDeleted: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      read: false,
      isDeleted: false
    },
    {
      $set: {
        read: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to mark all as seen
notificationSchema.statics.markAllAsSeen = async function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      seen: false,
      isDeleted: false
    },
    {
      $set: {
        seen: true,
        seenAt: new Date()
      }
    }
  );
};

// Static method to clean up old notifications
notificationSchema.statics.cleanup = async function(daysToKeep = 30) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  return this.deleteMany({
    $or: [
      { createdAt: { $lt: cutoffDate } },
      { expiresAt: { $lt: new Date() } },
      { isDeleted: true, deletedAt: { $lt: cutoffDate } }
    ]
  });
};

// Static method to send bulk notifications
notificationSchema.statics.sendBulk = async function(recipientIds, notificationData) {
  const notifications = recipientIds.map(recipientId => ({
    ...notificationData,
    recipient: recipientId
  }));

  return this.insertMany(notifications);
};

// Method to format for API response
notificationSchema.methods.toAPIResponse = function() {
  const response = this.toObject();

  // Add time ago formatting
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    response.timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    response.timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    response.timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    response.timeAgo = 'Just now';
  }

  return response;
};

// Virtual for checking if notification should trigger sound
notificationSchema.virtual('shouldPlaySound').get(function() {
  return this.sound && !this.seen && ['high', 'medium'].includes(this.priority);
});

module.exports = mongoose.model('Notification', notificationSchema);