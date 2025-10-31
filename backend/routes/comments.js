const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Video = require('../models/Video');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.post('/video/:videoId', auth, async (req, res) => {
  try {
    const { content, timestamp, parentCommentId } = req.body;

    const comment = await Comment.create({
      content,
      author: req.userId,
      video: req.params.videoId,
      timestamp,
      parentComment: parentCommentId
    });

    await Video.findByIdAndUpdate(req.params.videoId, {
      $push: { comments: comment._id }
    });

    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

router.post('/:id/highlight', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const user = await User.findById(req.userId);
    if (user.runegold.balance < 20) {
      return res.status(400).json({ error: 'Insufficient Runegold' });
    }

    await user.updateRunegoldBalance(20, 'spend', 'Comment highlight');
    await comment.applyHighlight(req.userId);

    res.json({ message: 'Comment highlighted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to highlight comment' });
  }
});

module.exports = router;