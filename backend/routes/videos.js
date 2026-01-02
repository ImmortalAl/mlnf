const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GridFSBucket, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Video = require('../models/Video');
const User = require('../models/User');
const { authMiddleware } = require('./auth');

// Multer configuration for GridFS
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Upload video
router.post('/upload', authMiddleware, upload.single('video'), [
  body('title').notEmpty().isLength({ max: 200 }).withMessage('Title is required and must be under 200 characters'),
  body('description').optional().isLength({ max: 5000 }).withMessage('Description must be under 5000 characters'),
  // Custom validator for tags (comes as JSON string from FormData)
  body('tags').custom((value) => {
    // Parse if string
    let tags = value;
    if (typeof value === 'string') {
      try {
        tags = JSON.parse(value);
      } catch (e) {
        throw new Error('Invalid tags format');
      }
    }
    // Validate array
    if (!Array.isArray(tags)) {
      throw new Error('Tags must be an array');
    }
    if (tags.length < 1 || tags.length > 3) {
      throw new Error('Select 1-3 tags');
    }
    // Validate each tag
    const validTags = ['Truths', 'Rebels', 'General'];
    for (const tag of tags) {
      if (!validTags.includes(tag)) {
        throw new Error(`Invalid tag: ${tag}`);
      }
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    const { title, description, tags, category, isExclusive, exclusivePrice } = req.body;
    const bucket = req.app.get('bucket');
    
    // Create upload stream to GridFS
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        uploaderId: req.user._id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      }
    });
    
    // Upload file to GridFS
    uploadStream.end(req.file.buffer);
    
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });
    
    // Create video document
    const video = new Video({
      title,
      description: description || '',
      uploader: req.user._id,
      fileId: uploadStream.id,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      tags: JSON.parse(tags || '[]'),
      category: category || 'Other',
      isExclusive: isExclusive === 'true',
      exclusivePrice: isExclusive === 'true' ? (parseInt(exclusivePrice) || 200) : 200,
      status: 'active',
      publishedAt: new Date()
    });
    
    await video.save();
    
    // Add video to user's uploaded videos
    await User.findByIdAndUpdate(req.user._id, {
      $push: { uploadedVideos: video._id }
    });
    
    // Emit socket event for new video
    const io = req.app.get('io');
    io.emit('newVideo', {
      id: video._id,
      title: video.title,
      uploader: req.user.username,
      tags: video.tags,
      timestamp: new Date()
    });
    
    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        tags: video.tags,
        fileId: video.fileId
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Stream video
router.get('/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if video is exclusive and user has access
    if (video.isExclusive && req.user) {
      if (!video.hasAccess(req.user._id)) {
        return res.status(403).json({ error: 'This is exclusive content. Purchase required.' });
      }
    }
    
    const bucket = req.app.get('bucket');
    const downloadStream = bucket.openDownloadStream(new ObjectId(video.fileId));
    
    // Set appropriate headers
    res.set({
      'Content-Type': video.mimeType,
      'Accept-Ranges': 'bytes'
    });
    
    // Handle range requests for video seeking
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : video.size - 1;
      
      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${video.size}`,
        'Content-Length': end - start + 1
      });
      
      // Create new download stream with range
      const rangeStream = bucket.openDownloadStream(new ObjectId(video.fileId), {
        start,
        end: end + 1
      });
      
      rangeStream.pipe(res);
    } else {
      downloadStream.pipe(res);
    }
    
    // Increment view count
    if (req.user) {
      await video.addView(req.user._id);
    } else {
      await video.addView(null);
    }
  } catch (error) {
    console.error('Video stream error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Get all videos with filters
router.get('/', async (req, res) => {
  try {
    const { 
      tag, 
      category, 
      search, 
      sortBy = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 20,
      boosted = false
    } = req.query;
    
    const query = { status: 'active', isPublic: true };
    
    // Apply filters
    if (tag) query.tags = tag;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }
    if (boosted === 'true') {
      query.isBoosted = true;
      query.boostExpiresAt = { $gt: new Date() };
    }
    
    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    const videos = await Video.find(query)
      .populate('uploader', 'username profilePicture')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-comments');
    
    const total = await Video.countDocuments(query);
    
    res.json({
      videos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

// Get single video details
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findById(videoId)
      .populate('uploader', 'username profilePicture bio followerCount')
      .populate('comments.user', 'username profilePicture')
      .populate('comments.replies.user', 'username profilePicture');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json({ video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// Vote on video
router.post('/:videoId/vote', authMiddleware, [
  body('voteType').isIn(['upvote', 'downvote']).withMessage('Invalid vote type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { videoId } = req.params;
    const { voteType } = req.body;
    
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const result = await video.toggleVote(req.user._id, voteType);
    
    // Update user's liked videos
    if (voteType === 'upvote' && result.action === 'upvoted') {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { likedVideos: videoId }
      });
    } else if (result.action === 'removed_upvote') {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { likedVideos: videoId }
      });
    }
    
    // Create notification for video owner
    if (result.action === 'upvoted' && video.uploader.toString() !== req.user._id.toString()) {
      const uploader = await User.findById(video.uploader);
      await uploader.addNotification(
        'like',
        `${req.user.username} upvoted your video "${video.title}"`,
        req.user._id,
        video._id
      );
    }
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.emit('voteUpdate', {
      videoId,
      ...result
    });
    
    res.json(result);
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote on video' });
  }
});

// Add comment to video
router.post('/:videoId/comment', authMiddleware, [
  body('content').notEmpty().isLength({ max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  body('timestamp').optional().isNumeric().withMessage('Invalid timestamp')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { videoId } = req.params;
    const { content, timestamp } = req.body;
    
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const comment = await video.addComment(req.user._id, content, timestamp);
    
    // Populate user info
    await Video.populate(comment, {
      path: 'user',
      select: 'username profilePicture'
    });
    
    // Create notification for video owner
    if (video.uploader.toString() !== req.user._id.toString()) {
      const uploader = await User.findById(video.uploader);
      await uploader.addNotification(
        'comment',
        `${req.user.username} commented on your video "${video.title}"`,
        req.user._id,
        video._id
      );
    }
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.emit('commentAdded', {
      videoId,
      comment
    });
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Reply to comment
router.post('/:videoId/comment/:commentId/reply', authMiddleware, [
  body('content').notEmpty().isLength({ max: 500 }).withMessage('Reply must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { videoId, commentId } = req.params;
    const { content } = req.body;
    
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const comment = video.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    comment.replies.push({
      user: req.user._id,
      content
    });
    
    await video.save();
    
    // Create notification for comment author
    if (comment.user.toString() !== req.user._id.toString()) {
      const commentAuthor = await User.findById(comment.user);
      await commentAuthor.addNotification(
        'comment',
        `${req.user.username} replied to your comment`,
        req.user._id,
        video._id
      );
    }
    
    res.json({
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Report video
router.post('/:videoId/report', authMiddleware, [
  body('reason').isIn(['spam', 'inappropriate', 'copyright', 'misinformation', 'harassment', 'other']).withMessage('Invalid report reason'),
  body('details').optional().isLength({ max: 500 }).withMessage('Details must be under 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { videoId } = req.params;
    const { reason, details } = req.body;
    
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if user already reported this video
    const existingReport = video.reports.find(
      r => r.user.toString() === req.user._id.toString() && r.status === 'pending'
    );
    
    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this video' });
    }
    
    video.reports.push({
      user: req.user._id,
      reason,
      details: details || ''
    });
    
    // Flag video if it reaches threshold
    if (video.reports.filter(r => r.status === 'pending').length >= 5) {
      video.status = 'flagged';
    }
    
    await video.save();
    
    res.json({
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Report video error:', error);
    res.status(500).json({ error: 'Failed to report video' });
  }
});

// Delete video (owner only)
router.delete('/:videoId', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check ownership
    if (video.uploader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this video' });
    }
    
    // Delete from GridFS
    const bucket = req.app.get('bucket');
    await bucket.delete(new ObjectId(video.fileId));
    
    // Remove from user's uploaded videos
    await User.findByIdAndUpdate(video.uploader, {
      $pull: { uploadedVideos: videoId }
    });
    
    // Delete video document
    await video.deleteOne();
    
    res.json({
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Get user's uploaded videos
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    const videos = await Video.find({ 
      uploader: userId, 
      status: 'active',
      isPublic: true 
    })
      .populate('uploader', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-comments');
    
    const total = await Video.countDocuments({ 
      uploader: userId, 
      status: 'active',
      isPublic: true 
    });
    
    res.json({
      videos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({ error: 'Failed to get user videos' });
  }
});

// Get trending videos
router.get('/trending/now', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const videos = await Video.find({
      status: 'active',
      isPublic: true,
      createdAt: { $gte: oneDayAgo }
    })
      .populate('uploader', 'username profilePicture')
      .sort({ views: -1, netScore: -1 })
      .limit(10)
      .select('-comments');
    
    res.json({ videos });
  } catch (error) {
    console.error('Get trending videos error:', error);
    res.status(500).json({ error: 'Failed to get trending videos' });
  }
});

module.exports = router;