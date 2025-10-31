const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const { auth, optionalAuth } = require('../middleware/auth');

// Get user profile
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('videos', 'title thumbnail views createdAt')
      .populate('badges');

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOwnProfile = req.userId && req.userId.toString() === user._id.toString();
    const isFollowing = req.userId && user.followers.includes(req.userId);

    res.json({
      user,
      isOwnProfile,
      isFollowing,
      stats: {
        videoCount: user.videos.length,
        followerCount: user.followerCount,
        followingCount: user.followingCount
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Follow/Unfollow user
router.post('/:username/follow', auth, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser._id.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(req.userId);
    const isFollowing = targetUser.followers.includes(req.userId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUser._id, {
        $pull: { followers: req.userId }
      });
      await User.findByIdAndUpdate(req.userId, {
        $pull: { following: targetUser._id }
      });
      res.json({ message: 'Unfollowed successfully', isFollowing: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetUser._id, {
        $addToSet: { followers: req.userId }
      });
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { following: targetUser._id }
      });
      res.json({ message: 'Followed successfully', isFollowing: true });
    }
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ error: 'Failed to follow/unfollow user' });
  }
});

// Get online users
router.get('/online/list', async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select('username avatar runegold.balance badges')
      .limit(50);

    res.json({ users: onlineUsers });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

module.exports = router;