const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Get conversation between current user and another user
router.get('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    // Validate the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get conversation messages
    const messages = await Message.getConversation(
      req.userId,
      userId,
      parseInt(limit),
      parseInt(skip)
    );
    
    // Mark messages from the other user as read
    await Message.markAsRead(req.userId, userId);
    
    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      otherUser: {
        id: otherUser._id,
        username: otherUser.username
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send a message (REST API fallback)
router.post('/send', authenticate, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    
    if (!recipientId || !message) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }
    
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
    }
    
    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Create and save message
    const newMessage = new Message({
      sender: req.userId,
      senderUsername: req.user.username,
      recipient: recipientId,
      recipientUsername: recipient.username,
      message: message,
      delivered: true
    });
    
    await newMessage.save();
    
    // Emit socket event if socket.io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('newMessage', {
        messageId: newMessage._id,
        from: req.userId,
        to: recipientId,
        message: message,
        timestamp: newMessage.createdAt
      });
    }
    
    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get recent conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const conversations = await Message.getRecentConversations(
      req.userId,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get unread message count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.userId);
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark conversation as read
router.post('/mark-read/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Message.markAsRead(req.userId, userId);
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete a message (soft delete - mark as deleted by sender)
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findOne({
      _id: messageId,
      sender: req.userId
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }
    
    await message.deleteOne();
    
    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Search messages
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query, limit = 50 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const messages = await Message.find({
      $or: [
        { sender: req.userId },
        { recipient: req.userId }
      ],
      message: { $regex: query, $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

module.exports = router;
