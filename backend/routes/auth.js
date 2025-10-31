const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -secretAnswer');
    
    if (!user || !user.isActive) {
      throw new Error();
    }
    
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ error: 'Account is temporarily locked' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
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
    .notEmpty()
    .withMessage('Secret question is required'),
  body('secretAnswer')
    .notEmpty()
    .withMessage('Secret answer is required'),
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

module.exports = router;
module.exports.authMiddleware = authMiddleware;