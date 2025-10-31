const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'emoji', 'image', 'video', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    url: String,
    mimetype: String,
    size: Number
  }],
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  metadata: {
    isP2P: {
      type: Boolean,
      default: true
    },
    roomId: String,
    isAnnouncement: {
      type: Boolean,
      default: false
    }
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
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, read: 1 });
messageSchema.index({ createdAt: -1 });

// Generate conversation ID for P2P messages
messageSchema.statics.generateConversationId = function(userId1, userId2) {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, skip = 0) {
  const conversationId = this.generateConversationId(userId1, userId2);

  return this.find({
    conversationId,
    isDeleted: false,
    deletedFor: { $ne: userId1 }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('sender', 'username avatar isOnline')
  .populate('receiver', 'username avatar isOnline')
  .populate('replyTo', 'content sender');
};

// Mark messages as read
messageSchema.statics.markAsRead = async function(conversationId, userId) {
  return this.updateMany(
    {
      conversationId,
      receiver: userId,
      read: false
    },
    {
      $set: {
        read: true,
        readAt: new Date()
      }
    }
  );
};

// Get unread count
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiver: userId,
    read: false,
    isDeleted: false,
    deletedFor: { $ne: userId }
  });
};

// Get recent conversations
messageSchema.statics.getRecentConversations = async function(userId, limit = 20) {
  const pipeline = [
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { receiver: mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false,
        deletedFor: { $ne: mongoose.Types.ObjectId(userId) }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$read', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        let: {
          senderId: '$lastMessage.sender',
          receiverId: '$lastMessage.receiver'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ['$_id', '$$senderId'] },
                      { $eq: ['$_id', '$$receiverId'] }
                    ]
                  },
                  { $ne: ['$_id', mongoose.Types.ObjectId(userId)] }
                ]
              }
            }
          }
        ],
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $project: {
        conversationId: '$_id',
        lastMessage: 1,
        unreadCount: 1,
        otherUser: {
          _id: 1,
          username: 1,
          avatar: 1,
          isOnline: 1,
          lastSeen: 1
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: limit
    }
  ];

  return this.aggregate(pipeline);
};

// Method to add reaction
messageSchema.methods.addReaction = async function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );

  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji
  });

  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = async function(newContent) {
  // Save current content to history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });

  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();

  return this.save();
};

// Method to delete message
messageSchema.methods.deleteMessage = async function(userId) {
  // Soft delete - mark as deleted for specific user
  if (!this.deletedFor.includes(userId)) {
    this.deletedFor.push(userId);
  }

  // If both users have deleted, mark as fully deleted
  if (this.deletedFor.length >= 2) {
    this.isDeleted = true;
    this.deletedAt = new Date();
  }

  return this.save();
};

// Virtual to check if message is from user
messageSchema.virtual('isSender').get(function() {
  return function(userId) {
    return this.sender.toString() === userId.toString();
  };
});

// Method to format for API response
messageSchema.methods.toAPIResponse = function(userId) {
  const response = this.toObject();

  // Add isSender flag
  response.isSender = this.sender.toString() === userId.toString();

  // Hide deleted content
  if (this.isDeleted || this.deletedFor.includes(userId)) {
    response.content = '[Message deleted]';
    response.attachments = [];
  }

  return response;
};

module.exports = mongoose.model('Message', messageSchema);