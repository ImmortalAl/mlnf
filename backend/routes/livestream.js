const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Livestream = require('../models/Livestream');
const User = require('../models/User');
const { authMiddleware } = require('./auth');

// Get all live streams (The Fleet)
router.get('/fleet', async (req, res) => {
  try {
    const { limit = 20, sortBy = 'viewers' } = req.query;

    let sortOption = {};
    if (sortBy === 'viewers') {
      sortOption = { currentViewers: -1 };
    } else if (sortBy === 'recent') {
      sortOption = { startedAt: -1 };
    } else if (sortBy === 'battleTested') {
      sortOption = { battleTested: -1, currentViewers: -1 };
    }

    const streams = await Livestream.find({ status: 'live' })
      .populate('creator', 'username profilePicture badges')
      .sort(sortOption)
      .limit(parseInt(limit));

    res.json({ streams });
  } catch (error) {
    console.error('Get fleet error:', error);
    res.status(500).json({ error: 'Failed to get live streams' });
  }
});

// Get my streams (authenticated user) - MUST be before /:id route
router.get('/my-streams', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, status } = req.query;

    const query = { creator: req.user._id };
    if (status) {
      query.status = status;
    }

    const streams = await Livestream.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ streams });
  } catch (error) {
    console.error('Get my streams error:', error);
    res.status(500).json({ error: 'Failed to get your streams' });
  }
});

// Get single stream details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await Livestream.findById(id)
      .populate('creator', 'username profilePicture badges runegoldBalance')
      .populate('raidParty', 'username profilePicture');

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json({ stream });
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({ error: 'Failed to get stream' });
  }
});

// Create new stream (Prepare for Voyage)
router.post('/create', authMiddleware, [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('category').optional().trim(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, tags } = req.body;

    // Check if user already has an active stream
    const existingStream = await Livestream.findOne({
      creator: req.user._id,
      status: { $in: ['offline', 'live'] }
    });

    if (existingStream) {
      return res.status(400).json({
        error: 'You already have an active stream. End it before creating a new one.',
        streamId: existingStream._id
      });
    }

    // Generate stream key
    const streamKey = Livestream.generateStreamKey();

    // Create stream
    const stream = new Livestream({
      creator: req.user._id,
      streamKey,
      title,
      description: description || '',
      category: category || 'General',
      tags: tags || []
    });

    await stream.save();

    // Return stream info (including stream key for OBS setup)
    const streamWithKey = await Livestream.findById(stream._id)
      .select('+streamKey')
      .populate('creator', 'username profilePicture');

    res.json({
      message: 'Stream created successfully',
      stream: {
        id: streamWithKey._id,
        title: streamWithKey.title,
        description: streamWithKey.description,
        streamKey: streamWithKey.streamKey,
        rtmpUrl: `rtmp://150.136.140.253:1935/live`,
        streamUrl: streamWithKey.rtmpUrl,
        obsSetup: {
          server: 'rtmp://150.136.140.253:1935/live',
          streamKey: streamWithKey.streamKey
        }
      }
    });
  } catch (error) {
    console.error('Create stream error:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Start stream (Embark!)
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await Livestream.findById(id);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (stream.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await stream.startStream();

    // Emit socket event (if io is available)
    const io = req.app.get('io');
    if (io) {
      io.emit('streamStarted', {
        streamId: stream._id,
        creator: req.user.username,
        title: stream.title
      });
    }

    res.json({
      message: 'Stream started - you are now live!',
      stream
    });
  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({ error: `Failed to start stream: ${error.message}` });
  }
});

// End stream (Return to Port)
router.post('/:id/end', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await Livestream.findById(id);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (stream.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await stream.endStream();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('streamEnded', {
      streamId: stream._id
    });

    res.json({
      message: 'Stream ended successfully',
      stream: {
        id: stream._id,
        duration: stream.duration,
        peakViewers: stream.peakViewers,
        runegoldEarned: stream.runegoldEarned
      }
    });
  } catch (error) {
    console.error('End stream error:', error);
    res.status(500).json({ error: 'Failed to end stream' });
  }
});

// Update viewer count (called by backend monitoring or nginx callback)
router.post('/:id/viewers', async (req, res) => {
  try {
    const { id } = req.params;
    const { count } = req.body;

    const stream = await Livestream.findById(id);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    await stream.updateViewerCount(count);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('viewerCountUpdate', {
      streamId: stream._id,
      viewers: count
    });

    res.json({ viewers: count });
  } catch (error) {
    console.error('Update viewers error:', error);
    res.status(500).json({ error: 'Failed to update viewer count' });
  }
});

// Super chat (Runegold donation during stream)
router.post('/:id/superchat', authMiddleware, [
  body('amount').isInt({ min: 50 }).withMessage('Minimum super chat is 50 Runegold'),
  body('message').optional().isLength({ max: 200 }).withMessage('Message max 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { amount, message } = req.body;

    const stream = await Livestream.findById(id).populate('creator');
    const user = await User.findById(req.user._id);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (stream.status !== 'live') {
      return res.status(400).json({ error: 'Stream is not live' });
    }

    if (user.runegoldBalance < amount) {
      return res.status(400).json({ error: 'Insufficient Runegold balance' });
    }

    // Deduct from sender
    await user.addRunegoldTransaction(
      'spend',
      amount,
      `Super chat to ${stream.creator.username}: ${message || '(no message)'}`,
      stream._id,
      'Livestream'
    );

    // Add to stream
    const superChat = await stream.addSuperChat(user._id, amount, message || '');

    // Platform takes 10%, creator gets 90%
    const creatorAmount = Math.floor(amount * 0.9);
    await stream.creator.addRunegoldTransaction(
      'receive',
      creatorAmount,
      `Super chat from ${user.username} during stream`,
      stream._id,
      'Livestream'
    );

    // Emit socket event
    const io = req.app.get('io');
    io.emit('superChat', {
      streamId: stream._id,
      user: {
        username: user.username,
        profilePicture: user.profilePicture
      },
      amount,
      message: message || '',
      timestamp: superChat.timestamp
    });

    res.json({
      message: 'Super chat sent!',
      balance: user.runegoldBalance - amount
    });
  } catch (error) {
    console.error('Super chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to send super chat' });
  }
});

// Flag stream (Controversy Amplifier)
router.post('/:id/flag', authMiddleware, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const stream = await Livestream.findById(id);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    stream.flagCount += 1;

    // Check if now battle-tested
    const newlyBattleTested = await stream.checkBattleTested();

    if (newlyBattleTested) {
      // Emit event - this stream just became battle-tested!
      const io = req.app.get('io');
      io.emit('battleTested', {
        streamId: stream._id,
        title: stream.title
      });
    }

    res.json({
      message: 'Stream flagged',
      flagCount: stream.flagCount,
      battleTested: stream.battleTested
    });
  } catch (error) {
    console.error('Flag stream error:', error);
    res.status(500).json({ error: 'Failed to flag stream' });
  }
});

// Get creator's streams
router.get('/creator/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, status } = req.query;

    const query = { creator: userId };
    if (status) {
      query.status = status;
    }

    const streams = await Livestream.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('creator', 'username profilePicture');

    res.json({ streams });
  } catch (error) {
    console.error('Get creator streams error:', error);
    res.status(500).json({ error: 'Failed to get streams' });
  }
});

// Verify stream key (called by nginx on publish)
router.post('/verify', async (req, res) => {
  try {
    const { name } = req.body; // Stream key from nginx

    const stream = await Livestream.findOne({
      streamKey: name,
      status: 'offline'
    });

    if (!stream) {
      // Reject stream
      return res.status(403).send('Invalid stream key');
    }

    // Accept stream and mark as live
    await stream.startStream();

    res.status(200).send('OK');
  } catch (error) {
    console.error('Verify stream error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
