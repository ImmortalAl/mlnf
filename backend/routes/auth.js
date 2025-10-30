const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, secretQuestion, secretAnswer, referralCode } = req.body;

    // Validate input
    if (!username || !password || !secretQuestion || !secretAnswer) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create new user
    const newUser = new User({
      username,
      password,
      secretQuestion,
      secretAnswer
    });

    // Handle referral if code provided
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        newUser.referredBy = referrer._id;
        
        // Award referral bonus to referrer
        const referralBonus = parseInt(process.env.RUNEGOLD_REFERRAL) || 100;
        await referrer.updateRunegoldBalance(
          referralBonus,
          'referral',
          `Referred new user: ${username}`
        );
        
        // Send notification to referrer
        await referrer.addNotification({
          type: 'runegold',
          message: `You earned ${referralBonus} Runegold for referring ${username}!`,
          relatedUser: newUser._id
        });
      }
    }

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Check daily login bonus
    const loginBonus = await newUser.checkDailyLogin();

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        runegoldBalance: newUser.runegoldBalance,
        referralCode: newUser.referralCode,
        role: newUser.role
      },
      loginBonus
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is banned
    if (user.isBanned) {
      if (user.banExpiry && user.banExpiry > new Date()) {
        return res.status(403).json({ 
          error: 'Account banned',
          reason: user.banReason,
          expiresAt: user.banExpiry
        });
      } else {
        // Ban expired, unban user
        user.isBanned = false;
        user.banReason = null;
        user.banExpiry = null;
        await user.save();
      }
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Check daily login bonus
    const loginBonus = await user.checkDailyLogin();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        runegoldBalance: user.runegoldBalance,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences
      },
      loginBonus
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/recover
router.post('/recover', async (req, res) => {
  try {
    const { username, secretQuestion, secretAnswer, newPassword } = req.body;

    // Find user
    const user = await User.findOne({ username, secretQuestion });
    if (!user) {
      return res.status(404).json({ error: 'User not found or incorrect security question' });
    }

    // Verify secret answer
    const isMatch = await user.compareSecretAnswer(secretAnswer);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect answer to security question' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Recovery error:', error);
    res.status(500).json({ error: 'Failed to recover account' });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -secretAnswer')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar')
      .populate('badges');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { bio, avatar, preferences } = req.body;
    
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (preferences !== undefined) updates.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -secretAnswer');

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/auth/follow/:userId
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId
      );
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      // Send notification
      await targetUser.addNotification({
        type: 'follow',
        message: `${currentUser.username} started following you`,
        relatedUser: currentUserId
      });
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });

  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow/unfollow user' });
  }
});

// GET /api/auth/notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('notifications.relatedUser', 'username avatar')
      .populate('notifications.relatedVideo', 'title thumbnail');

    const notifications = user.notifications.slice(0, 50); // Return latest 50

    res.json(notifications);

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/auth/notifications/read
router.put('/notifications/read', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    await User.updateOne(
      { _id: req.user.userId },
      { 
        $set: { 
          'notifications.$[elem].read': true 
        } 
      },
      { 
        arrayFilters: [{ 'elem._id': { $in: notificationIds } }] 
      }
    );

    res.json({ message: 'Notifications marked as read' });

  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    
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
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/auth/verify
router.get('/verify', authenticateToken, async (req, res) => {
  res.json({ 
    valid: true, 
    userId: req.user.userId 
  });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
