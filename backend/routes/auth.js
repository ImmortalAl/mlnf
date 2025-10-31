const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('secretQuestion')
    .optional()
    .isString()
    .withMessage('Secret question must be a string'),
  body('secretAnswer')
    .optional()
    .isString()
    .withMessage('Secret answer must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, secretQuestion, secretAnswer } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.username === username
          ? 'Username already taken'
          : 'Email already registered'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    // Add secret question if provided
    if (secretQuestion && secretAnswer) {
      user.secretQuestion = {
        question: secretQuestion,
        answer: secretAnswer
      };
    }

    await user.save();

    // Create welcome notification
    await Notification.createNotification({
      recipient: user._id,
      type: 'system',
      title: 'Welcome to Much Love, No Fear!',
      message: 'Your journey begins here. Explore videos, earn Runegold, and connect with the community.',
      priority: 'high'
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user data without sensitive fields
    const userData = user.toJSON();
    delete userData.password;
    delete userData.secretQuestion;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({
      $or: [
        { username },
        { email: username }
      ]
    }).select('+password +lockUntil +loginAttempts');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account is locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      const banMessage = user.banExpires && user.banExpires > Date.now()
        ? `Account is banned until ${user.banExpires.toLocaleDateString()}`
        : 'Account is permanently banned';

      return res.status(403).json({
        error: banMessage,
        reason: user.banReason
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last seen and online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without sensitive fields
    const userData = user.toJSON();

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      user.socketId = null;
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar')
      .populate('videos', 'title thumbnail views');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update user profile
router.patch('/me', auth, [
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('notifications').optional().isObject().withMessage('Notifications must be an object')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const allowedUpdates = ['bio', 'email', 'notifications', 'avatar'];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if email is already taken
    if (updates.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: req.userId }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      message: 'Password changed successfully',
      token
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Password recovery - Step 1: Verify secret question
router.post('/recover-password/verify', [
  body('username').notEmpty().withMessage('Username is required'),
  body('secretAnswer').notEmpty().withMessage('Secret answer is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, secretAnswer } = req.body;

    // Find user with secret question
    const user = await User.findOne({
      $or: [
        { username },
        { email: username }
      ]
    }).select('+secretQuestion');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.secretQuestion || !user.secretQuestion.answer) {
      return res.status(400).json({
        error: 'No recovery question set for this account'
      });
    }

    // Verify secret answer
    const isValid = await user.compareSecretAnswer(secretAnswer);

    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect answer' });
    }

    // Generate recovery token (valid for 1 hour)
    const recoveryToken = jwt.sign(
      { userId: user._id, purpose: 'password-recovery' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Answer verified successfully',
      recoveryToken,
      question: user.secretQuestion.question
    });

  } catch (error) {
    console.error('Password recovery error:', error);
    res.status(500).json({ error: 'Failed to verify recovery answer' });
  }
});

// Password recovery - Step 2: Reset password
router.post('/recover-password/reset', [
  body('recoveryToken').notEmpty().withMessage('Recovery token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recoveryToken, newPassword } = req.body;

    // Verify recovery token
    let decoded;
    try {
      decoded = jwt.verify(recoveryToken, process.env.JWT_SECRET);

      if (decoded.purpose !== 'password-recovery') {
        return res.status(401).json({ error: 'Invalid recovery token' });
      }
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired recovery token' });
    }

    // Find user and update password
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Reset login attempts
    await user.resetLoginAttempts();

    // Generate new login token
    const token = generateToken(user._id);

    res.json({
      message: 'Password reset successfully',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get secret question
router.post('/recover-password/question', [
  body('username').notEmpty().withMessage('Username is required')
], async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({
      $or: [
        { username },
        { email: username }
      ]
    }).select('secretQuestion.question');

    if (!user || !user.secretQuestion || !user.secretQuestion.question) {
      return res.status(404).json({
        error: 'No recovery question found for this account'
      });
    }

    res.json({
      question: user.secretQuestion.question
    });

  } catch (error) {
    console.error('Get secret question error:', error);
    res.status(500).json({ error: 'Failed to get secret question' });
  }
});

// Refresh token
router.post('/refresh-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Delete account
router.delete('/me', auth, [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    user.isOnline = false;
    await user.save();

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;