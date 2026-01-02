const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  
  // Recipient information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientUsername: {
    type: String,
    required: true
  },
  
  // Message content
  message: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // Message status
  read: {
    type: Boolean,
    default: false
  },
  delivered: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient conversation queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

// Index for unread messages
messageSchema.index({ recipient: 1, read: false });

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(userId1, userId2, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .lean();
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(recipientId, senderId) {
  return this.updateMany(
    { 
      recipient: recipientId, 
      sender: senderId, 
      read: false 
    },
    { 
      read: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ 
    recipient: userId, 
    read: false 
  });
};

// Static method to get recent conversations
messageSchema.statics.getRecentConversations = async function(userId, limit = 20) {
  // Convert userId to ObjectId (compatible with Mongoose 6+)
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const messages = await this.aggregate([
    {
      $match: {
        $or: [
          { sender: userObjectId },
          { recipient: userObjectId }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userObjectId] },
            '$recipient',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', userObjectId] },
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
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $project: {
        userId: '$_id',
        username: '$otherUser.username',
        lastMessage: '$lastMessage.message',
        lastMessageTime: '$lastMessage.createdAt',
        unreadCount: 1,
        read: '$lastMessage.read'
      }
    }
  ]);
  
  return messages;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
