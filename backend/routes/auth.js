const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ error: 'Please authenticate', reason: 'No token provided' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('❌ Auth failed: Invalid token -', jwtError.message);
      return res.status(401).json({ 
        error: 'Please authenticate', 
        reason: 'Invalid or expired token',
        detail: jwtError.message 
      });
    }
    
    const user = await User.findById(decoded.userId).select('-password -secretAnswer');
    
    if (!user) {
      console.log('❌ Auth failed: User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'Please authenticate', reason: 'User not found' });
    }
    
    if (!user.isActive) {
      console.log('❌ Auth failed: User account inactive:', user.username);
      return res.status(401).json({ error: 'Please authenticate', reason: 'Account inactive' });
    }
    
    if (user.lockUntil && user.lockUntil > Date.now()) {
      console.log('❌ Auth failed: Account locked:', user.username);
      return res.status(423).json({ error: 'Account is temporarily locked' });
    }
    
    console.log('✅ Auth successful:', user.username);
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ error: 'Please authenticate', reason: 'Authentication error' });
  }
};

// Register new user
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('secretQuestion')
    .optional()
    .trim(),
  body('secretAnswer')
    .optional()
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, password, email, secretQuestion, secretAnswer } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }
    
    // Create new user
    const user = new User({
      username,
      password,
      email: email || undefined,
      secretQuestion,
      secretAnswer
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Emit socket event for new user
    const io = req.app.get('io');
    io.emit('newUser', {
      username: user.username,
      userId: user._id
    });
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        runegoldBalance: user.runegoldBalance,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({ 
        error: `Account is locked. Try again in ${remainingTime} minutes` 
      });
    }
    
    // Check if user is banned
    if (!user.canPerformAction()) {
      return res.status(403).json({ 
        error: 'Account is banned',
        reason: user.banReason 
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Emit socket event for login
    const io = req.app.get('io');
    io.emit('userLogin', {
      username: user.username,
      userId: user._id
    });
    
    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        runegoldBalance: user.runegoldBalance,
        badges: user.badges,
        role: user.role,
        preferences: user.preferences,
        followerCount: user.followerCount,
        followingCount: user.followingCount
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -secretAnswer')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .populate('uploadedVideos', 'title thumbnail views');
    
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.patch('/profile', authMiddleware, [
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('email').optional().isEmail().withMessage('Invalid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const updates = {};
    const allowedUpdates = ['bio', 'email', 'profilePicture', 'preferences'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -secretAnswer');
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Password recovery - Get secret question
router.post('/recovery/question', [
  body('username').notEmpty().withMessage('Username is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username } = req.body;
    
    const user = await User.findOne({ username }).select('secretQuestion');
    
    if (!user) {
      // Don't reveal if user exists or not
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ secretQuestion: user.secretQuestion });
  } catch (error) {
    console.error('Recovery question error:', error);
    res.status(500).json({ error: 'Failed to get recovery question' });
  }
});

// Password recovery - Verify answer and reset password
router.post('/recovery/reset', [
  body('username').notEmpty().withMessage('Username is required'),
  body('secretAnswer').notEmpty().withMessage('Secret answer is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, secretAnswer, newPassword } = req.body;
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid recovery information' });
    }
    
    // Verify secret answer
    const isMatch = await user.compareSecretAnswer(secretAnswer);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid recovery information' });
    }
    
    // Update password
    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Change password (authenticated)
router.post('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Follow/Unfollow user
router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentUser = await User.findById(req.user._id);
    
    const isFollowing = currentUser.following.includes(userId);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(userId);
      targetUser.followers.pull(req.user._id);
    } else {
      // Follow
      currentUser.following.push(userId);
      targetUser.followers.push(req.user._id);
      
      // Create notification
      await targetUser.addNotification(
        'follow',
        `${currentUser.username} started following you`,
        req.user._id
      );
    }
    
    await currentUser.save();
    await targetUser.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('followUpdate', {
      follower: req.user._id,
      following: userId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
    
    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow/unfollow user' });
  }
});

// Get notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('notifications.relatedUser', 'username profilePicture')
      .populate('notifications.relatedVideo', 'title thumbnail');
    
    res.json({ notifications: user.notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const user = await User.findById(req.user._id);
    const notification = user.notifications.id(notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    await user.save();
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Logout (optional - mainly for cleanup)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Emit socket event for logout
    const io = req.app.get('io');
    io.emit('userLogout', {
      username: req.user.username,
      userId: req.user._id
    });
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Debug endpoint to test token
router.post('/debug-token', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({ 
        status: 'no_token',
        message: 'No token provided in Authorization header',
        headers: req.headers
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('username email isActive');
      
      return res.json({
        status: 'valid',
        message: 'Token is valid',
        decoded: {
          userId: decoded.userId,
          username: decoded.username,
          exp: new Date(decoded.exp * 1000).toISOString()
        },
        user: user ? {
          username: user.username,
          email: user.email,
          isActive: user.isActive
        } : null
      });
    } catch (jwtError) {
      return res.json({
        status: 'invalid',
        message: 'Token is invalid',
        error: jwtError.message,
        tokenPreview: token.substring(0, 20) + '...'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users (for messaging - simple search by username)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    // Search by username (case-insensitive)
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: { $ne: false }
    })
    .select('_id username role profilePicture avatar')
    .limit(parseInt(limit))
    .lean();

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get all users (for warriors list)
router.get('/users', async (req, res) => {
  try {
    const { search, sort = 'newest', limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'mostFollowers':
        sortQuery = { followerCount: -1 };
        break;
      case 'mostVideos':
        sortQuery = { videoCount: -1 };
        break;
      case 'mostActive':
        sortQuery = { lastActive: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch users
    const users = await User.find(query)
      .select('username email bio profilePicture avatar badges followers following createdAt')
      .sort(sortQuery)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Add computed fields
    const usersWithCounts = users.map(user => ({
      ...user,
      followerCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      videoCount: 0 // TODO: Add actual video count from Video model
    }));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users: usersWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user profile
router.put('/update-profile', authMiddleware, [
  body('firstName').optional({ values: 'falsy' }).trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('lastName').optional({ values: 'falsy' }).trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email'),
  body('bio').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  // Social links: skip validation for empty strings, validate as URL if provided
  body('socialLinks.twitter').optional({ values: 'falsy' }).trim().isURL().withMessage('Invalid Twitter URL'),
  body('socialLinks.youtube').optional({ values: 'falsy' }).trim().isURL().withMessage('Invalid YouTube URL'),
  body('socialLinks.telegram').optional({ values: 'falsy' }).trim().isURL().withMessage('Invalid Telegram URL'),
  body('socialLinks.website').optional({ values: 'falsy' }).trim().isURL().withMessage('Invalid website URL'),
  body('privateProfile').optional().isBoolean().withMessage('Private profile must be boolean'),
  body('hideEmail').optional().isBoolean().withMessage('Hide email must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      bio,
      socialLinks,
      location,
      avatar,
      privateProfile,
      hideEmail
    } = req.body;

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;
    if (privateProfile !== undefined) user.privateProfile = privateProfile;
    if (hideEmail !== undefined) user.hideEmail = hideEmail;

    // Update social links if provided
    if (socialLinks) {
      if (!user.socialLinks) user.socialLinks = {};
      if (socialLinks.twitter !== undefined) user.socialLinks.twitter = socialLinks.twitter;
      if (socialLinks.youtube !== undefined) user.socialLinks.youtube = socialLinks.youtube;
      if (socialLinks.telegram !== undefined) user.socialLinks.telegram = socialLinks.telegram;
      if (socialLinks.website !== undefined) user.socialLinks.website = socialLinks.website;
    }

    await user.save();

    // Return updated user (exclude password)
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.secretAnswer;

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get recent activity feed for user
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = userId.toString();
    const activities = [];
    const now = new Date();

    // Import models (with error handling)
    let Video, BlogPost, NewsArticle, Message;
    try {
      Video = require('../models/Video');
      BlogPost = require('../models/BlogPost');
      NewsArticle = require('../models/NewsArticle');
      Message = require('../models/Message');
    } catch (modelError) {
      console.error('Model import error:', modelError);
    }

    // Get user's recent videos
    if (Video) {
      try {
        const userVideos = await Video.find({ uploader: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('title views createdAt');

        userVideos.forEach(video => {
          activities.push({
            type: 'video_upload',
            icon: 'fa-video',
            color: 'var(--success)',
            text: `You uploaded "${video.title}"`,
            subtext: `${video.views || 0} views`,
            time: video.createdAt,
            link: `/pages/video.html?id=${video._id}`
          });
        });
      } catch (e) {
        console.error('Error fetching user videos:', e.message);
      }
    }

    // Get user's recent blog posts
    if (BlogPost) {
      try {
        const userBlogs = await BlogPost.find({ author: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('title views createdAt');

        userBlogs.forEach(post => {
          activities.push({
            type: 'blog_post',
            icon: 'fa-pen-fancy',
            color: 'var(--indigo)',
            text: `You published "${post.title}"`,
            subtext: `${post.views || 0} views`,
            time: post.createdAt,
            link: `/pages/blog-post.html?id=${post._id}`
          });
        });
      } catch (e) {
        console.error('Error fetching user blogs:', e.message);
      }
    }

    // Get user's recent news posts
    if (NewsArticle) {
      try {
        const userNews = await NewsArticle.find({ author: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('title views createdAt');

        userNews.forEach(article => {
          activities.push({
            type: 'news_post',
            icon: 'fa-newspaper',
            color: 'var(--peach)',
            text: `You posted news: "${article.title}"`,
            subtext: `${article.views || 0} views`,
            time: article.createdAt,
            link: `/pages/news-article.html?id=${article._id}`
          });
        });
      } catch (e) {
        console.error('Error fetching user news:', e.message);
      }
    }

    // Get recent messages received
    if (Message) {
      try {
        const recentMessages = await Message.find({ recipient: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('senderUsername createdAt');

        recentMessages.forEach(msg => {
          if (msg.senderUsername) {
            activities.push({
              type: 'message',
              icon: 'fa-envelope',
              color: 'var(--navy)',
              text: `New message from ${msg.senderUsername}`,
              subtext: '',
              time: msg.createdAt,
              link: '#messages'
            });
          }
        });
      } catch (e) {
        console.error('Error fetching messages:', e.message);
      }
    }

    // Get new followers (if user has followers array)
    try {
      const user = await User.findById(userId).populate('followers', 'username createdAt');
      if (user && user.followers && user.followers.length > 0) {
        const recentFollowers = user.followers.slice(-3).reverse();
        recentFollowers.forEach(follower => {
          if (follower && follower.username) {
            activities.push({
              type: 'new_follower',
              icon: 'fa-user-plus',
              color: 'var(--gold)',
              text: `${follower.username} started following you`,
              subtext: '',
              time: follower.createdAt || now,
              link: `/pages/profiles.html?id=${follower._id}`
            });
          }
        });
      }
    } catch (e) {
      console.error('Error fetching followers:', e.message);
    }

    // Get videos user has voted on recently
    if (Video) {
      try {
        const votedVideos = await Video.find({
          $or: [
            { upvotes: userId },
            { downvotes: userId }
          ]
        })
          .sort({ updatedAt: -1 })
          .limit(3)
          .select('title upvotes downvotes updatedAt');

        votedVideos.forEach(video => {
          // Convert ObjectIds to strings for comparison
          const upvoteIds = video.upvotes.map(id => id.toString());
          const isUpvote = upvoteIds.includes(userIdStr);
          activities.push({
            type: 'video_vote',
            icon: isUpvote ? 'fa-thumbs-up' : 'fa-thumbs-down',
            color: isUpvote ? 'var(--success)' : 'var(--error)',
            text: `You ${isUpvote ? 'upvoted' : 'downvoted'} "${video.title}"`,
            subtext: '',
            time: video.updatedAt,
            link: `/pages/video.html?id=${video._id}`
          });
        });
      } catch (e) {
        console.error('Error fetching voted videos:', e.message);
      }
    }

    // Sort all activities by time, most recent first
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Limit to 10 most recent
    const recentActivities = activities.slice(0, 10);

    // Format times
    const formatTimeAgo = (date) => {
      if (!date) return 'Recently';
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return new Date(date).toLocaleDateString();
    };

    const formattedActivities = recentActivities.map(a => ({
      ...a,
      timeFormatted: formatTimeAgo(a.time)
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity feed', details: error.message });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;