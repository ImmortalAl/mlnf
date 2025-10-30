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
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  secretQuestion: {
    type: String,
    required: [true, 'Secret question is required'],
    enum: [
      'What was your first pet\'s name?',
      'What city were you born in?',
      'What is your mother\'s maiden name?',
      'What was the name of your first school?',
      'What is your favorite book?'
    ]
  },
  secretAnswer: {
    type: String,
    required: [true, 'Secret answer is required']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: '/assets/images/default-avatar.png'
  },
  runegoldBalance: {
    type: Number,
    default: 100, // Starting balance for new users
    min: 0
  },
  badges: [{
    type: {
      type: String,
      enum: ['pioneer', 'contributor', 'champion', 'legend', 'custom']
    },
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  watchHistory: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    duration: Number // seconds watched
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['vote', 'comment', 'follow', 'runegold', 'badge', 'system']
    },
    message: String,
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relatedVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  runeJourney: [{
    event: String,
    description: String,
    runegoldChange: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  dailyLoginStreak: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
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
  banExpiry: Date,
  preferences: {
    darkMode: {
      type: Boolean,
      default: false
    },
    soundNotifications: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ runegoldBalance: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'notifications.read': 1 });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Hash password before saving
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

// Hash secret answer before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('secretAnswer')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.secretAnswer = await bcrypt.hash(this.secretAnswer.toLowerCase(), salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code on user creation
userSchema.pre('save', function(next) {
  if (!this.referralCode && this.isNew) {
    this.referralCode = this.username.toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Compare secret answer method
userSchema.methods.compareSecretAnswer = async function(candidateAnswer) {
  return await bcrypt.compare(candidateAnswer.toLowerCase(), this.secretAnswer);
};

// Add notification method
userSchema.methods.addNotification = function(notification) {
  this.notifications.unshift(notification);
  // Keep only last 100 notifications
  if (this.notifications.length > 100) {
    this.notifications = this.notifications.slice(0, 100);
  }
  return this.save();
};

// Update Runegold balance method
userSchema.methods.updateRunegoldBalance = async function(amount, event, description) {
  this.runegoldBalance += amount;
  this.runeJourney.push({
    event,
    description,
    runegoldChange: amount
  });
  return this.save();
};

// Check daily login bonus
userSchema.methods.checkDailyLogin = async function() {
  const now = new Date();
  const lastLogin = new Date(this.lastLogin);
  const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);
  
  if (hoursSinceLastLogin >= 20) { // At least 20 hours since last login
    if (hoursSinceLastLogin <= 28) { // Within 28 hours maintains streak
      this.dailyLoginStreak += 1;
    } else {
      this.dailyLoginStreak = 1; // Reset streak
    }
    
    const bonusAmount = parseInt(process.env.RUNEGOLD_DAILY_LOGIN) || 10;
    await this.updateRunegoldBalance(bonusAmount, 'daily_login', `Daily login bonus (Streak: ${this.dailyLoginStreak})`);
    this.lastLogin = now;
    return { bonus: bonusAmount, streak: this.dailyLoginStreak };
  }
  
  return null;
};

// Ensure virtuals are included in JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.secretAnswer;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
