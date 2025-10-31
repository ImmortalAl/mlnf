const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  runegold: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    journey: [{
      action: String,
      amount: Number,
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  badges: [{
    name: String,
    icon: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    expiresAt: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sound: {
      type: Boolean,
      default: true
    }
  },
  secretQuestion: {
    question: String,
    answer: String
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'runegold.balance': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isOnline: 1 });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash secret answer
userSchema.pre('save', async function(next) {
  if (!this.isModified('secretQuestion.answer')) return next();

  try {
    if (this.secretQuestion && this.secretQuestion.answer) {
      const salt = await bcrypt.genSalt(10);
      this.secretQuestion.answer = await bcrypt.hash(this.secretQuestion.answer.toLowerCase(), salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Compare secret answer
userSchema.methods.compareSecretAnswer = async function(candidateAnswer) {
  try {
    if (!this.secretQuestion || !this.secretQuestion.answer) {
      return false;
    }
    return await bcrypt.compare(candidateAnswer.toLowerCase(), this.secretQuestion.answer);
  } catch (error) {
    return false;
  }
};

// Add to Runegold journey
userSchema.methods.addToRunegoldJourney = function(action, amount, description) {
  this.runegold.journey.push({
    action,
    amount,
    description,
    timestamp: new Date()
  });

  // Keep only last 100 journey entries
  if (this.runegold.journey.length > 100) {
    this.runegold.journey = this.runegold.journey.slice(-100);
  }
};

// Update Runegold balance
userSchema.methods.updateRunegoldBalance = async function(amount, action, description) {
  if (action === 'add' || action === 'earn') {
    this.runegold.balance += amount;
    this.runegold.totalEarned += amount;
  } else if (action === 'spend' || action === 'deduct') {
    if (this.runegold.balance < amount) {
      throw new Error('Insufficient Runegold balance');
    }
    this.runegold.balance -= amount;
    this.runegold.totalSpent += amount;
  }

  this.addToRunegoldJourney(action, amount, description);
  return this.save();
};

// Add badge
userSchema.methods.addBadge = function(badgeName, badgeIcon, badgeDescription) {
  const existingBadge = this.badges.find(b => b.name === badgeName);
  if (!existingBadge) {
    this.badges.push({
      name: badgeName,
      icon: badgeIcon,
      description: badgeDescription,
      earnedAt: new Date()
    });
  }
  return this.save();
};

// Check if user is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Exclude sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.secretQuestion;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

module.exports = mongoose.model('User', userSchema);