const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

// GridFS setup
let gridFSBucket;
mongoose.connection.once('open', () => {
  gridFSBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'videos'
  });
});

// Multer configuration for video upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// POST /api/videos/upload
router.post('/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const userId = req.user.userId;

    // Validate tags
    const parsedTags = JSON.parse(tags || '[]');
    if (parsedTags.length === 0 || parsedTags.length > 3) {
      return res.status(400).json({ error: 'Please select 1-3 tags' });
    }

    // Upload to GridFS
    const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
      metadata: {
        userId,
        uploadDate: new Date()
      }
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      // Create video document
      const video = new Video({
        title,
        description,
        uploadedBy: userId,
        fileId: uploadStream.id,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        tags: parsedTags
      });

      await video.save();

      // Update user's video list and award Runegold
      const user = await User.findById(userId);
      user.videos.push(video._id);
      
      const uploadBonus = parseInt(process.env.RUNEGOLD_VIDEO_UPLOAD) || 50;
      await user.updateRunegoldBalance(
        uploadBonus,
        'video_upload',
        `Uploaded video: ${title}`
      );

      res.status(201).json({
        message: 'Video uploaded successfully',
        video,
        runegoldEarned: uploadBonus
      });
    });

    uploadStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload video' });
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to process video upload' });
  }
});

// GET /api/videos
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'recent', 
      tag, 
      search,
      boosted = false 
    } = req.query;

    const query = {};
    
    // Filter by tag
    if (tag) {
      query.tags = tag;
    }
    
    // Search in title and description
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter boosted videos
    if (boosted === 'true') {
      query['boost.isActive'] = true;
      query['boost.expiresAt'] = { $gt: new Date() };
    }

    // Determine sort order
    let sortOrder = {};
    switch (sort) {
      case 'popular':
        sortOrder = { netScore: -1 };
        break;
      case 'views':
        sortOrder = { views: -1 };
        break;
      case 'recent':
      default:
        sortOrder = { createdAt: -1 };
    }

    const videos = await Video.find(query)
      .sort(sortOrder)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'username avatar')
      .lean();

    const total = await Video.countDocuments(query);

    // Check and update expired boosts
    for (const video of videos) {
      if (video.boost.isActive && video.boost.expiresAt < new Date()) {
        await Video.findByIdAndUpdate(video._id, {
          'boost.isActive': false
        });
      }
    }

    res.json({
      videos,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Videos fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// GET /api/videos/:id
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'username avatar followers')
      .populate('comments.user', 'username avatar')
      .lean();

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment views
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(video);

  } catch (error) {
    console.error('Video fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// GET /api/videos/:id/stream
router.get('/:id/stream', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const downloadStream = gridFSBucket.openDownloadStream(video.fileId);
    
    res.set({
      'Content-Type': video.mimetype,
      'Content-Length': video.size,
      'Accept-Ranges': 'bytes'
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('Video stream error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// POST /api/videos/:id/vote
router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { voteType } = req.body; // 'up', 'down', or 'remove'
    const videoId = req.params.id;
    const userId = req.user.userId;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const previousVote = video.getUserVote(userId);
    await video.vote(userId, voteType === 'remove' ? null : voteType);

    // Send notification to video owner if new upvote
    if (voteType === 'up' && !previousVote && video.uploadedBy.toString() !== userId) {
      const videoOwner = await User.findById(video.uploadedBy);
      await videoOwner.addNotification({
        type: 'vote',
        message: 'Someone upvoted your video',
        relatedVideo: videoId
      });
    }

    res.json({
      message: 'Vote recorded',
      upvotes: video.upvoteCount,
      downvotes: video.downvoteCount,
      netScore: video.netScore,
      userVote: voteType === 'remove' ? null : voteType
    });

  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// POST /api/videos/:id/comment
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text, timestamp } = req.body;
    const videoId = req.params.id;
    const userId = req.user.userId;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await video.addComment(userId, text, timestamp);

    // Award Runegold for commenting
    const user = await User.findById(userId);
    const commentBonus = parseInt(process.env.RUNEGOLD_COMMENT) || 5;
    await user.updateRunegoldBalance(
      commentBonus,
      'comment',
      `Commented on video: ${video.title}`
    );

    // Send notification to video owner
    if (video.uploadedBy.toString() !== userId) {
      const videoOwner = await User.findById(video.uploadedBy);
      await videoOwner.addNotification({
        type: 'comment',
        message: `${user.username} commented on your video`,
        relatedVideo: videoId,
        relatedUser: userId
      });
    }

    // Populate the new comment with user data
    const updatedVideo = await Video.findById(videoId)
      .populate('comments.user', 'username avatar');
    
    const newComment = updatedVideo.comments[updatedVideo.comments.length - 1];

    res.status(201).json({
      message: 'Comment added',
      comment: newComment,
      runegoldEarned: commentBonus
    });

  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// POST /api/videos/:id/boost
router.post('/:id/boost', authenticateToken, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.userId;
    const boostCost = 50;

    const [video, user] = await Promise.all([
      Video.findById(videoId),
      User.findById(userId)
    ]);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.boost.isActive) {
      return res.status(400).json({ error: 'Video is already boosted' });
    }

    if (user.runegoldBalance < boostCost) {
      return res.status(400).json({ 
        error: 'Insufficient Runegold balance',
        required: boostCost,
        current: user.runegoldBalance
      });
    }

    // Deduct Runegold and boost video
    await user.updateRunegoldBalance(
      -boostCost,
      'boost',
      `Boosted video: ${video.title}`
    );

    await video.boostVideo(userId);

    res.json({
      message: 'Video boosted successfully',
      expiresAt: video.boost.expiresAt,
      runegoldSpent: boostCost
    });

  } catch (error) {
    console.error('Boost error:', error);
    res.status(500).json({ error: 'Failed to boost video' });
  }
});

// POST /api/videos/:id/comment/:commentId/highlight
router.post('/:id/comment/:commentId/highlight', authenticateToken, async (req, res) => {
  try {
    const { id: videoId, commentId } = req.params;
    const userId = req.user.userId;
    const highlightCost = 20;

    const [video, user] = await Promise.all([
      Video.findById(videoId),
      User.findById(userId)
    ]);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const comment = video.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only highlight your own comments' });
    }

    if (comment.isHighlighted) {
      return res.status(400).json({ error: 'Comment is already highlighted' });
    }

    if (user.runegoldBalance < highlightCost) {
      return res.status(400).json({ 
        error: 'Insufficient Runegold balance',
        required: highlightCost,
        current: user.runegoldBalance
      });
    }

    // Deduct Runegold and highlight comment
    await user.updateRunegoldBalance(
      -highlightCost,
      'highlight',
      `Highlighted comment on: ${video.title}`
    );

    await video.highlightComment(commentId);

    res.json({
      message: 'Comment highlighted successfully',
      expiresAt: comment.highlightExpiry,
      runegoldSpent: highlightCost
    });

  } catch (error) {
    console.error('Highlight error:', error);
    res.status(500).json({ error: 'Failed to highlight comment' });
  }
});

// POST /api/videos/:id/report
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const videoId = req.params.id;
    const userId = req.user.userId;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if user already reported this video
    const hasReported = video.reports.some(
      report => report.reportedBy.toString() === userId
    );

    if (hasReported) {
      return res.status(400).json({ error: 'You have already reported this video' });
    }

    video.reports.push({
      reportedBy: userId,
      reason,
      description
    });

    // Flag video if it has multiple reports
    if (video.reports.length >= 3) {
      video.isFlagged = true;
    }

    await video.save();

    res.json({ message: 'Report submitted successfully' });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.userId;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if user owns the video or is admin
    const user = await User.findById(userId);
    if (video.uploadedBy.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this video' });
    }

    // Delete from GridFS
    await gridFSBucket.delete(video.fileId);

    // Remove video from user's video list
    await User.findByIdAndUpdate(video.uploadedBy, {
      $pull: { videos: videoId }
    });

    // Delete video document
    await video.deleteOne();

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// GET /api/videos/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.params.userId;

    const videos = await Video.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'username avatar')
      .lean();

    const total = await Video.countDocuments({ uploadedBy: userId });

    res.json({
      videos,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('User videos fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user videos' });
  }
});

module.exports = router;
