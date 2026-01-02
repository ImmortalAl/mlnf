const express = require('express');
const router = express.Router();
const Forum = require('../models/Forum');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const { body, validationResult, param, query } = require('express-validator');

// GET /api/forum - Get all forum threads with filters
router.get('/', [
  query('category').optional().isIn(['war_council', 'healing_hall', 'trading_post', 'rune_chamber', 'shield_wall', 'saga_hall']),
  query('sortBy').optional().isIn(['latest', 'popular', 'replies', 'votes']),
  query('search').optional().trim().isLength({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, sortBy = 'latest', search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'popular':
        sort = { views: -1, lastActivity: -1 };
        break;
      case 'replies':
        sort = { 'replies.length': -1, lastActivity: -1 };
        break;
      case 'votes':
        // Sort by upvotes - downvotes (will be computed)
        sort = { lastActivity: -1 }; // Fallback, we'll sort in memory
        break;
      case 'latest':
      default:
        sort = { pinned: -1, lastActivity: -1 };
        break;
    }

    // Execute query
    const threads = await Forum.find(query)
      .populate('author', 'username avatar badges')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Add computed fields
    const threadsWithMeta = threads.map(thread => ({
      ...thread,
      replyCount: thread.replies?.length || 0,
      voteScore: (thread.upvotes?.length || 0) - (thread.downvotes?.length || 0)
    }));

    // If sorting by votes, sort in memory
    if (sortBy === 'votes') {
      threadsWithMeta.sort((a, b) => b.voteScore - a.voteScore);
    }

    const total = await Forum.countDocuments(query);

    res.json({
      threads: threadsWithMeta,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    res.status(500).json({ error: 'Failed to fetch forum threads' });
  }
});

// GET /api/forum/:id - Get single thread with replies
router.get('/:id', [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const thread = await Forum.findById(req.params.id)
      .populate('author', 'username avatar badges')
      .populate('replies.author', 'username avatar badges');

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Increment view count
    thread.views += 1;
    await thread.save();

    // Add computed fields
    const threadWithMeta = {
      ...thread.toObject(),
      replyCount: thread.replies?.length || 0,
      voteScore: (thread.upvotes?.length || 0) - (thread.downvotes?.length || 0)
    };

    res.json({ thread: threadWithMeta });
  } catch (error) {
    console.error('Error fetching forum thread:', error);
    res.status(500).json({ error: 'Failed to fetch forum thread' });
  }
});

// POST /api/forum - Create new thread
router.post('/', authMiddleware, [
  body('title').trim().notEmpty().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('content').trim().notEmpty().isLength({ min: 10, max: 10000 }).withMessage('Content must be 10-10000 characters'),
  body('category').isIn(['war_council', 'healing_hall', 'trading_post', 'rune_chamber', 'shield_wall', 'saga_hall']),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ max: 30 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category, tags } = req.body;

    const thread = new Forum({
      title,
      content,
      category,
      tags: tags || [],
      author: req.user._id
    });

    await thread.save();

    // Populate author before sending response
    await thread.populate('author', 'username avatar badges');

    // Create notification for followers (optional)
    // TODO: Notify followers about new thread

    res.status(201).json({ 
      message: 'Thread created successfully',
      thread: {
        ...thread.toObject(),
        replyCount: 0,
        voteScore: 0
      }
    });
  } catch (error) {
    console.error('Error creating forum thread:', error);
    res.status(500).json({ error: 'Failed to create forum thread' });
  }
});

// POST /api/forum/:id/reply - Add reply to thread
router.post('/:id/reply', authMiddleware, [
  param('id').isMongoId(),
  body('content').trim().notEmpty().isLength({ min: 1, max: 5000 }).withMessage('Reply must be 1-5000 characters'),
  body('parentReply').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const thread = await Forum.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    if (thread.locked) {
      return res.status(403).json({ error: 'Thread is locked' });
    }

    const { content, parentReply } = req.body;

    const reply = {
      author: req.user._id,
      content,
      parentReply: parentReply || null,
      upvotes: [],
      downvotes: [],
      createdAt: new Date()
    };

    thread.replies.push(reply);
    thread.lastActivity = new Date();
    await thread.save();

    // Populate the new reply's author
    await thread.populate('replies.author', 'username avatar badges');

    // Get the newly added reply
    const newReply = thread.replies[thread.replies.length - 1];

    // Create notification for thread author
    if (thread.author.toString() !== req.user._id.toString()) {
      const threadAuthor = await User.findById(thread.author);
      if (threadAuthor) {
        threadAuthor.notifications.push({
          type: 'comment',
          message: `${req.user.username} replied to your thread: "${thread.title}"`,
          relatedUser: req.user._id,
          relatedVideo: thread._id, // Using this field for thread reference
          read: false
        });
        await threadAuthor.save();

        // Socket.io notification (if connected)
        if (global.io) {
          global.io.to(thread.author.toString()).emit('notification', {
            type: 'comment',
            message: `${req.user.username} replied to your thread`,
            threadId: thread._id,
            threadTitle: thread.title
          });
        }
      }
    }

    res.status(201).json({ 
      message: 'Reply added successfully',
      reply: newReply
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// POST /api/forum/:id/vote - Vote on thread
router.post('/:id/vote', authMiddleware, [
  param('id').isMongoId(),
  body('voteType').isIn(['upvote', 'downvote'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const thread = await Forum.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const { voteType } = req.body;
    const userId = req.user._id;

    // Remove user from both arrays first
    thread.upvotes = thread.upvotes.filter(id => id.toString() !== userId.toString());
    thread.downvotes = thread.downvotes.filter(id => id.toString() !== userId.toString());

    let action = 'removed';

    // Check if this is a toggle (user clicked same vote type)
    const wasUpvoted = thread.upvotes.some(id => id.toString() === userId.toString());
    const wasDownvoted = thread.downvotes.some(id => id.toString() === userId.toString());

    if (voteType === 'upvote' && !wasUpvoted) {
      thread.upvotes.push(userId);
      action = 'upvoted';
    } else if (voteType === 'downvote' && !wasDownvoted) {
      thread.downvotes.push(userId);
      action = 'downvoted';
    }

    await thread.save();

    res.json({
      message: 'Vote recorded',
      action,
      upvotes: thread.upvotes.length,
      downvotes: thread.downvotes.length,
      voteScore: thread.upvotes.length - thread.downvotes.length
    });
  } catch (error) {
    console.error('Error voting on thread:', error);
    res.status(500).json({ error: 'Failed to vote on thread' });
  }
});

// POST /api/forum/:threadId/reply/:replyId/vote - Vote on reply
router.post('/:threadId/reply/:replyId/vote', authMiddleware, [
  param('threadId').isMongoId(),
  param('replyId').isMongoId(),
  body('voteType').isIn(['upvote', 'downvote'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const thread = await Forum.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const reply = thread.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    const { voteType } = req.body;
    const userId = req.user._id;

    // Remove user from both arrays first
    reply.upvotes = reply.upvotes.filter(id => id.toString() !== userId.toString());
    reply.downvotes = reply.downvotes.filter(id => id.toString() !== userId.toString());

    let action = 'removed';

    // Check if this is a toggle
    const wasUpvoted = reply.upvotes.some(id => id.toString() === userId.toString());
    const wasDownvoted = reply.downvotes.some(id => id.toString() === userId.toString());

    if (voteType === 'upvote' && !wasUpvoted) {
      reply.upvotes.push(userId);
      action = 'upvoted';
    } else if (voteType === 'downvote' && !wasDownvoted) {
      reply.downvotes.push(userId);
      action = 'downvoted';
    }

    await thread.save();

    res.json({
      message: 'Vote recorded',
      action,
      upvotes: reply.upvotes.length,
      downvotes: reply.downvotes.length,
      voteScore: reply.upvotes.length - reply.downvotes.length
    });
  } catch (error) {
    console.error('Error voting on reply:', error);
    res.status(500).json({ error: 'Failed to vote on reply' });
  }
});

// DELETE /api/forum/:id - Delete thread (author or admin only)
router.delete('/:id', authMiddleware, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const thread = await Forum.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Check if user is the author
    if (thread.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this thread' });
    }

    await Forum.findByIdAndDelete(req.params.id);

    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// PATCH /api/forum/:id/pin - Pin/unpin thread (admin only)
router.patch('/:id/pin', authMiddleware, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    // Admin/moderator check
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins and moderators can pin threads' });
    }

    const thread = await Forum.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    thread.pinned = !thread.pinned;
    await thread.save();

    res.json({ 
      message: thread.pinned ? 'Thread pinned' : 'Thread unpinned',
      pinned: thread.pinned
    });
  } catch (error) {
    console.error('Error pinning thread:', error);
    res.status(500).json({ error: 'Failed to pin thread' });
  }
});

// PATCH /api/forum/:id/lock - Lock/unlock thread (admin only)
router.patch('/:id/lock', authMiddleware, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    // Admin/moderator check
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins and moderators can lock threads' });
    }

    const thread = await Forum.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    thread.locked = !thread.locked;
    await thread.save();

    res.json({ 
      message: thread.locked ? 'Thread locked' : 'Thread unlocked',
      locked: thread.locked
    });
  } catch (error) {
    console.error('Error locking thread:', error);
    res.status(500).json({ error: 'Failed to lock thread' });
  }
});

module.exports = router;
