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
    trim: true,
    lowercase: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  secretQuestion: {
    type: String,
    default: ''
  },
  secretAnswer: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  runegoldBalance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  runegoldJourney: [{
    type: {
      type: String,
      enum: ['purchase', 'spend', 'receive', 'reward', 'admin_injection'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'runegoldJourney.relatedModel'
    },
    relatedModel: {
      type: String,
      enum: ['Video', 'User', 'Comment', 'Badge']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    balanceAfter: {
      type: Number,
      required: true
    }
  }],
  badges: [{
    name: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  uploadedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  likedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  boostedVideos: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    boostedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'runegold', 'badge', 'system'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
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
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notificationSound: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: false
    },
    privateProfile: {
      type: Boolean,
      default: false
    },
    autoplayVideos: {
      type: Boolean,
      default: true
    }
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
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ runegoldBalance: -1 });
userSchema.index({ 'notifications.read': 1, 'notifications.createdAt': -1 });
userSchema.index({ createdAt: -1 });

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

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare secret answer
userSchema.methods.compareSecretAnswer = async function(candidateAnswer) {
  return await bcrypt.compare(candidateAnswer.toLowerCase(), this.secretAnswer);
};

// Method to add Runegold transaction
userSchema.methods.addRunegoldTransaction = async function(type, amount, description, relatedId = null, relatedModel = null) {
  const previousBalance = this.runegoldBalance;
  
  if (type === 'spend' && this.runegoldBalance < amount) {
    throw new Error('Insufficient Runegold balance');
  }
  
  const newBalance = type === 'spend' 
    ? this.runegoldBalance - amount 
    : this.runegoldBalance + amount;
  
  this.runegoldBalance = newBalance;
  
  const transaction = {
    type,
    amount,
    description,
    balanceAfter: newBalance
  };
  
  if (relatedId && relatedModel) {
    transaction.relatedId = relatedId;
    transaction.relatedModel = relatedModel;
  }
  
  this.runegoldJourney.push(transaction);
  
  await this.save();
  
  return {
    previousBalance,
    newBalance,
    transaction
  };
};

// Method to add notification
userSchema.methods.addNotification = async function(type, message, relatedUser = null, relatedVideo = null) {
  const notification = {
    type,
    message
  };
  
  if (relatedUser) notification.relatedUser = relatedUser;
  if (relatedVideo) notification.relatedVideo = relatedVideo;
  
  this.notifications.unshift(notification);
  
  // Keep only last 100 notifications
  if (this.notifications.length > 100) {
    this.notifications = this.notifications.slice(0, 100);
  }
  
  await this.save();
  return notification;
};

// Method to check if user can perform action
userSchema.methods.canPerformAction = function() {
  if (this.isBanned) {
    if (this.banExpiry && this.banExpiry > new Date()) {
      return false;
    } else {
      // Ban has expired, unban user
      this.isBanned = false;
      this.banReason = undefined;
      this.banExpiry = undefined;
      this.save();
    }
  }
  return this.isActive;
};

// Method to increment failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.lockUntil) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }
  
  return await this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 }
  });
};

// Ensure virtual fields are included in JSON
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