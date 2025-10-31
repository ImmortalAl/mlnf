const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GridFSBucket, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, optionalAuth } = require('../middleware/auth');

// Multer configuration for GridFS
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Get all videos with filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'recent',
      category,
      tags,
      search,
      author,
      boosted
    } = req.query;

    const query = { status: 'active', isDeleted: false };

    // Add filters
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };
    if (author) query.author = author;
    if (search) {
      query.$text = { $search: search };
    }
    if (boosted === 'true') {
      query['boost.isActive'] = true;
      query['boost.expiresAt'] = { $gt: new Date() };
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'trending':
        sortOption = { netScore: -1, views: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const videos = await Video.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'username avatar badges')
      .lean();

    const total = await Video.countDocuments(query);

    // Check user access for exclusive videos
    if (req.userId) {
      videos.forEach(video => {
        video.hasAccess = !video.isExclusive || video.canAccess(req.userId);
      });
    }

    res.json({
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get boosted videos carousel
router.get('/boosted', async (req, res) => {
  try {
    const videos = await Video.getBoostedVideos();
    res.json({ videos });
  } catch (error) {
    console.error('Get boosted videos error:', error);
    res.status(500).json({ error: 'Failed to fetch boosted videos' });
  }
});

// Get single video
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('author', 'username avatar badges followers')
      .populate({
        path: 'comments',
        match: { status: 'visible', parentComment: null },
        populate: [
          { path: 'author', select: 'username avatar badges' },
          {
            path: 'replies',
            populate: { path: 'author', select: 'username avatar badges' }
          }
        ],
        options: { sort: { 'highlight.isActive': -1, netScore: -1, createdAt: -1 } }
      });

    if (!video || video.isDeleted) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check access for exclusive content
    if (video.isExclusive && !video.canAccess(req.userId)) {
      return res.status(403).json({
        error: 'This is exclusive content',
        accessPrice: video.accessPrice
      });
    }

    // Increment view count
    if (req.userId) {
      await video.incrementView(req.userId);
    } else {
      await video.incrementView(null);
    }

    // Get user's vote if authenticated
    let userVote = null;
    if (req.userId) {
      const userIdStr = req.userId.toString();
      if (video.upvotes.some(v => v.user.toString() === userIdStr)) {
        userVote = 'upvote';
      } else if (video.downvotes.some(v => v.user.toString() === userIdStr)) {
        userVote = 'downvote';
      }
    }

    res.json({
      video,
      userVote,
      hasAccess: !video.isExclusive || video.canAccess(req.userId)
    });

  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Upload video
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    const { title, description, tags, category, isExclusive, accessPrice } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Create GridFS bucket
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'videos' });

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        userId: req.userId,
        uploadDate: new Date()
      }
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      try {
        // Create video document
        const video = new Video({
          title,
          description,
          fileId: uploadStream.id,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [],
          category: category || 'general',
          author: req.userId,
          isExclusive: isExclusive === 'true',
          accessPrice: isExclusive === 'true' ? (parseInt(accessPrice) || 200) : 0
        });

        await video.save();

        // Update user's video list
        await User.findByIdAndUpdate(req.userId, {
          $push: { videos: video._id }
        });

        res.status(201).json({
          message: 'Video uploaded successfully',
          video
        });

      } catch (error) {
        // Delete file from GridFS if video creation fails
        await bucket.delete(uploadStream.id);
        throw error;
      }
    });

    uploadStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload video' });
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Stream video
router.get('/:id/stream', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video || video.isDeleted) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check access
    if (video.isExclusive && !video.canAccess(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'videos' });

    // Get file info
    const files = await bucket.find({ _id: video.fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const file = files[0];
    const fileSize = file.length;

    // Parse range header for video streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimetype
      });

      bucket.openDownloadStream(video.fileId, { start, end: end + 1 }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype
      });

      bucket.openDownloadStream(video.fileId).pipe(res);
    }

  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Vote on video
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { voteType } = req.body;

    if (!['upvote', 'downvote', 'none'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const video = await Video.findById(req.params.id);

    if (!video || video.isDeleted) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await video.vote(req.userId, voteType === 'none' ? null : voteType);

    // Send notification to video author
    if (voteType !== 'none' && video.author.toString() !== req.userId.toString()) {
      const user = await User.findById(req.userId);
      await Notification.createNotification({
        recipient: video.author,
        sender: req.userId,
        type: voteType,
        message: `${user.username} ${voteType}d your video "${video.title}"`,
        relatedItem: {
          itemId: video._id,
          itemType: 'Video'
        }
      });
    }

    res.json({
      message: 'Vote recorded',
      upvotes: video.upvoteCount,
      downvotes: video.downvoteCount,
      netScore: video.netScore
    });

  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Boost video
router.post('/:id/boost', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video || video.isDeleted) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if already boosted
    if (video.isBoostActive()) {
      return res.status(400).json({ error: 'Video is already boosted' });
    }

    // Check user's Runegold balance
    const user = await User.findById(req.userId);
    const boostCost = 50;

    if (user.runegold.balance < boostCost) {
      return res.status(400).json({
        error: 'Insufficient Runegold',
        required: boostCost,
        balance: user.runegold.balance
      });
    }

    // Deduct Runegold and boost video
    await user.updateRunegoldBalance(boostCost, 'spend', `Boosted video: ${video.title}`);
    await video.applyBoost(req.userId);

    // Track in Runegold pool
    const RunegoldPool = require('../models/RunegoldPool');
    const pool = await RunegoldPool.getCurrent();
    await pool.addTransaction('spend', req.userId, boostCost, 'Video boost', {
      itemType: 'Video',
      relatedItem: video._id
    });

    res.json({
      message: 'Video boosted successfully',
      boostExpiresAt: video.boost.expiresAt,
      runegoldBalance: user.runegold.balance - boostCost
    });

  } catch (error) {
    console.error('Boost video error:', error);
    res.status(500).json({ error: 'Failed to boost video' });
  }
});

// Report video
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;

    const validReasons = ['spam', 'inappropriate', 'copyright', 'misleading', 'violence', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }

    const video = await Video.findById(req.params.id);

    if (!video || video.isDeleted) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await video.reportVideo(req.userId, reason, description);

    res.json({ message: 'Video reported successfully' });

  } catch (error) {
    if (error.message === 'You have already reported this video') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Report video error:', error);
    res.status(500).json({ error: 'Failed to report video' });
  }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check ownership
    if (video.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'You can only delete your own videos' });
    }

    // Soft delete
    video.isDeleted = true;
    video.deletedAt = new Date();
    video.status = 'removed';
    await video.save();

    // Remove from user's video list
    await User.findByIdAndUpdate(req.userId, {
      $pull: { videos: video._id }
    });

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Get video analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check ownership
    if (video.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'You can only view analytics for your own videos' });
    }

    const analytics = {
      views: video.views,
      uniqueViewers: video.uniqueViewers.length,
      upvotes: video.upvoteCount,
      downvotes: video.downvoteCount,
      netScore: video.netScore,
      comments: await Comment.countDocuments({ video: video._id, status: 'visible' }),
      avgWatchTime: video.analytics.avgWatchTime,
      completionRate: video.analytics.completionRate,
      shareCount: video.analytics.shareCount,
      runegoldEarned: video.analytics.runegoldEarned,
      totalTips: video.monetization.totalTips
    };

    res.json({ analytics });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;