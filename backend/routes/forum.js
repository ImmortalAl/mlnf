const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ForumTopic = require('../models/ForumTopic');
const { authMiddleware } = require('./auth');

// Get all forum topics
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      pinned,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (pinned === 'true') query.pinned = true;
    
    const topics = await ForumTopic.find(query)
      .populate('author', 'username profilePicture')
      .populate('lastReply.user', 'username')
      .sort({ pinned: -1, updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ForumTopic.countDocuments(query);
    
    res.json({
      topics,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get forum topics error:', error);
    res.status(500).json({ error: 'Failed to get forum topics' });
  }
});

// Get single forum topic
router.get('/:id', async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id)
      .populate('author', 'username profilePicture bio')
      .populate('replies.user', 'username profilePicture');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Increment views
    await topic.incrementViews();
    
    res.json({ topic });
  } catch (error) {
    console.error('Get forum topic error:', error);
    res.status(500).json({ error: 'Failed to get forum topic' });
  }
});

// Create forum topic (authenticated)
router.post('/', authMiddleware, [
  body('title').notEmpty().isLength({ max: 200 }),
  body('content').notEmpty(),
  body('category').optional().isIn(['General', 'Announcements', 'Help', 'Off-Topic', 'Truths', 'Health', 'Finance'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, category } = req.body;
    
    const topic = new ForumTopic({
      title,
      content,
      category,
      author: req.user._id
    });
    
    await topic.save();
    
    res.status(201).json({
      message: 'Forum topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Create forum topic error:', error);
    res.status(500).json({ error: 'Failed to create forum topic' });
  }
});

// Add reply to forum topic
router.post('/:id/reply', authMiddleware, [
  body('content').notEmpty().isLength({ max: 5000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const topic = await ForumTopic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    if (topic.locked) {
      return res.status(403).json({ error: 'This topic is locked' });
    }
    
    await topic.addReply(req.user._id, req.body.content);
    
    res.status(201).json({
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

module.exports = router;
