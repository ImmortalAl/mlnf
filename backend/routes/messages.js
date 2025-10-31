const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.getRecentConversations(req.userId);
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.getConversation(req.userId, req.params.userId);
    await Message.markAsRead(Message.generateConversationId(req.userId, req.params.userId), req.userId);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const conversationId = Message.generateConversationId(req.userId, receiverId);

    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content,
      conversationId
    });

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;