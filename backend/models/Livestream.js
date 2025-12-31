const mongoose = require('mongoose');
const crypto = require('crypto');

const livestreamSchema = new mongoose.Schema({
  // Creator info
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Stream authentication
  streamKey: {
    type: String,
    unique: true,
    required: true,
    select: false // Don't return in queries by default (security)
  },

  // Stream metadata
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000
  },

  // Stream status
  status: {
    type: String,
    enum: ['offline', 'live', 'ending', 'ended'],
    default: 'offline',
    index: true
  },

  // Viewer tracking
  currentViewers: {
    type: Number,
    default: 0
  },
  peakViewers: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },

  // Timing
  scheduledStart: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in seconds

  // Technical info
  hlsUrl: String,
  thumbnailUrl: String,

  // Chat settings
  chatEnabled: {
    type: Boolean,
    default: true
  },
  chatSlowMode: {
    type: Number,
    default: 0 // seconds between messages, 0 = off
  },
  chatSubOnly: {
    type: Boolean,
    default: false
  },

  // Runegold economy
  runegoldEarned: {
    type: Number,
    default: 0
  },
  superChats: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number, // Runegold amount
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Viking features
  raidedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestream'
  },
  raidedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestream'
  },
  raidParty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Battle-tested (controversy) metrics
  flagCount: {
    type: Number,
    default: 0
  },
  battleTested: {
    type: Boolean,
    default: false
  },

  // Categorization
  category: {
    type: String,
    default: 'General'
  },
  tags: [String],

  // VOD settings
  saveVOD: {
    type: Boolean,
    default: true
  },
  vodUrl: String,
  vodProcessed: {
    type: Boolean,
    default: false
  },

  // Moderation
  shieldmaidens: [{ // Moderators for this stream
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bannedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    bannedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Engagement tracking
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
livestreamSchema.index({ status: 1, startedAt: -1 }); // Find live streams
livestreamSchema.index({ creator: 1, createdAt: -1 }); // Creator's streams
livestreamSchema.index({ currentViewers: -1 }); // Sort by popularity
livestreamSchema.index({ battleTested: 1, currentViewers: -1 }); // Controversy amplifier

// Generate unique stream key
livestreamSchema.statics.generateStreamKey = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Hash stream key before saving
livestreamSchema.pre('save', async function(next) {
  if (!this.isModified('streamKey')) return next();

  try {
    // In production, you'd hash this. For development, keep it readable.
    // const bcrypt = require('bcryptjs');
    // const salt = await bcrypt.genSalt(10);
    // this.streamKey = await bcrypt.hash(this.streamKey, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to update viewer count
livestreamSchema.methods.updateViewerCount = async function(count) {
  this.currentViewers = count;
  if (count > this.peakViewers) {
    this.peakViewers = count;
  }
  await this.save();
};

// Method to start stream
livestreamSchema.methods.startStream = async function() {
  this.status = 'live';
  this.startedAt = new Date();
  await this.save();
};

// Method to end stream
livestreamSchema.methods.endStream = async function() {
  this.status = 'ended';
  this.endedAt = new Date();

  if (this.startedAt && this.endedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000); // seconds
  }

  await this.save();
};

// Method to add super chat
livestreamSchema.methods.addSuperChat = async function(userId, amount, message) {
  this.superChats.push({
    user: userId,
    amount,
    message
  });

  this.runegoldEarned += amount;
  await this.save();

  return this.superChats[this.superChats.length - 1];
};

// Method to check if battle-tested (controversy amplifier)
livestreamSchema.methods.checkBattleTested = async function() {
  // If stream gets 10+ flags, it becomes "battle-tested" and gets boosted
  if (this.flagCount >= 10 && !this.battleTested) {
    this.battleTested = true;
    await this.save();
    return true;
  }
  return false;
};

// Virtual for stream URL
livestreamSchema.virtual('streamUrl').get(function() {
  if (this.status === 'live' && this.hlsUrl) {
    return this.hlsUrl;
  }
  return null;
});

// Virtual for RTMP URL (what creators stream to)
livestreamSchema.virtual('rtmpUrl').get(function() {
  return `rtmp://mlnf.net/live/${this.streamKey}`;
});

// Ensure virtual fields are included in JSON
livestreamSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.streamKey; // Never expose stream key in API
    delete ret.__v;
    return ret;
  }
});

const Livestream = mongoose.model('Livestream', livestreamSchema);

module.exports = Livestream;
