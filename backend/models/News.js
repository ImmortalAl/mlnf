const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'News title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'News content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  summary: {
    type: String,
    required: true,
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    default: 'default-news-image.jpg'
  },
  category: {
    type: String,
    enum: ['announcement', 'update', 'community', 'feature', 'maintenance', 'event', 'contest', 'other'],
    default: 'announcement'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isCarousel: {
    type: Boolean,
    default: false
  },
  carouselOrder: {
    type: Number,
    default: 0
  },
  carouselExpiresAt: Date,
  monthlyBestVideo: {
    enabled: {
      type: Boolean,
      default: false
    },
    month: String, // YYYY-MM format
    nominees: [{
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
      },
      votes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        votedAt: {
          type: Date,
          default: Date.now
        }
      }],
      nominatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      nominatedAt: Date
    }],
    winner: {
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      runegoldPrize: {
        type: Number,
        default: 100
      },
      announcedAt: Date
    },
    votingEndsAt: Date,
    status: {
      type: String,
      enum: ['nominations', 'voting', 'ended', 'announced'],
      default: 'nominations'
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  reactions: {
    love: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    fear: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    rune: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedUntil: Date,
  expiresAt: Date,
  metadata: {
    source: String,
    sourceUrl: String,
    isExternal: {
      type: Boolean,
      default: false
    }
  },
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

// Indexes
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ priority: -1 });
newsSchema.index({ isCarousel: 1, carouselOrder: 1 });
newsSchema.index({ isPinned: 1, pinnedUntil: 1 });
newsSchema.index({ 'monthlyBestVideo.enabled': 1, 'monthlyBestVideo.status': 1 });
newsSchema.index({ title: 'text', content: 'text', summary: 'text' });

// Method to add to carousel
newsSchema.methods.addToCarousel = async function(order, daysToShow = 7) {
  this.isCarousel = true;
  this.carouselOrder = order;
  this.carouselExpiresAt = new Date(Date.now() + daysToShow * 24 * 60 * 60 * 1000);
  return this.save();
};

// Method to remove from carousel
newsSchema.methods.removeFromCarousel = async function() {
  this.isCarousel = false;
  this.carouselOrder = 0;
  this.carouselExpiresAt = null;
  return this.save();
};

// Method to pin news
newsSchema.methods.pin = async function(days = 7) {
  this.isPinned = true;
  this.pinnedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

// Method to unpin news
newsSchema.methods.unpin = async function() {
  this.isPinned = false;
  this.pinnedUntil = null;
  return this.save();
};

// Method to add reaction
newsSchema.methods.addReaction = async function(userId, reactionType) {
  const validReactions = ['love', 'fear', 'rune'];
  if (!validReactions.includes(reactionType)) {
    throw new Error('Invalid reaction type');
  }

  // Remove user from all reaction types
  validReactions.forEach(type => {
    this.reactions[type] = this.reactions[type].filter(
      id => id.toString() !== userId.toString()
    );
  });

  // Add to new reaction type
  this.reactions[reactionType].push(userId);

  return this.save();
};

// Method to nominate video for monthly best
newsSchema.methods.nominateVideo = async function(videoId, userId) {
  if (!this.monthlyBestVideo.enabled) {
    throw new Error('Monthly best video contest is not enabled for this news item');
  }

  if (this.monthlyBestVideo.status !== 'nominations') {
    throw new Error('Nominations are closed');
  }

  // Check if video is already nominated
  const existingNominee = this.monthlyBestVideo.nominees.find(
    n => n.video.toString() === videoId.toString()
  );

  if (existingNominee) {
    throw new Error('Video is already nominated');
  }

  // Add nomination
  this.monthlyBestVideo.nominees.push({
    video: videoId,
    nominatedBy: userId,
    nominatedAt: new Date(),
    votes: []
  });

  return this.save();
};

// Method to vote for monthly best video
newsSchema.methods.voteForVideo = async function(videoId, userId) {
  if (!this.monthlyBestVideo.enabled) {
    throw new Error('Monthly best video contest is not enabled');
  }

  if (this.monthlyBestVideo.status !== 'voting') {
    throw new Error('Voting is not open');
  }

  // Find the nominee
  const nominee = this.monthlyBestVideo.nominees.find(
    n => n.video.toString() === videoId.toString()
  );

  if (!nominee) {
    throw new Error('Video is not nominated');
  }

  // Check if user has already voted for any video
  const hasVoted = this.monthlyBestVideo.nominees.some(
    n => n.votes.some(v => v.user.toString() === userId.toString())
  );

  if (hasVoted) {
    throw new Error('You have already voted');
  }

  // Add vote
  nominee.votes.push({
    user: userId,
    votedAt: new Date()
  });

  return this.save();
};

// Method to announce monthly winner
newsSchema.methods.announceMonthlyWinner = async function() {
  if (!this.monthlyBestVideo.enabled) {
    throw new Error('Monthly best video contest is not enabled');
  }

  if (this.monthlyBestVideo.status !== 'voting') {
    throw new Error('Voting is not complete');
  }

  // Find winner (most votes)
  let winner = null;
  let maxVotes = 0;

  this.monthlyBestVideo.nominees.forEach(nominee => {
    if (nominee.votes.length > maxVotes) {
      maxVotes = nominee.votes.length;
      winner = nominee;
    }
  });

  if (winner) {
    // Populate winner details
    await this.populate('monthlyBestVideo.nominees.video');

    const winningVideo = this.monthlyBestVideo.nominees.find(
      n => n.video._id.toString() === winner.video.toString()
    ).video;

    this.monthlyBestVideo.winner = {
      video: winner.video,
      user: winningVideo.author,
      runegoldPrize: 100,
      announcedAt: new Date()
    };

    this.monthlyBestVideo.status = 'announced';

    // Award Runegold to winner
    const User = mongoose.model('User');
    const user = await User.findById(winningVideo.author);
    if (user) {
      await user.updateRunegoldBalance(100, 'earn', 'Won monthly best video contest');
    }
  }

  return this.save();
};

// Static method to get carousel news
newsSchema.statics.getCarousel = function() {
  return this.find({
    isCarousel: true,
    carouselExpiresAt: { $gt: new Date() },
    status: 'published'
  })
  .sort({ carouselOrder: 1, publishedAt: -1 })
  .populate('author', 'username avatar');
};

// Static method to expire carousel items
newsSchema.statics.expireCarouselItems = async function() {
  return this.updateMany(
    {
      isCarousel: true,
      carouselExpiresAt: { $lte: new Date() }
    },
    {
      $set: {
        isCarousel: false,
        carouselOrder: 0
      },
      $unset: {
        carouselExpiresAt: 1
      }
    }
  );
};

// Static method to get pinned news
newsSchema.statics.getPinned = function() {
  return this.find({
    isPinned: true,
    $or: [
      { pinnedUntil: { $gt: new Date() } },
      { pinnedUntil: null }
    ],
    status: 'published'
  })
  .sort({ priority: -1, publishedAt: -1 })
  .populate('author', 'username avatar');
};

// Static method to expire pinned items
newsSchema.statics.expirePinnedItems = async function() {
  return this.updateMany(
    {
      isPinned: true,
      pinnedUntil: { $lte: new Date() }
    },
    {
      $set: { isPinned: false },
      $unset: { pinnedUntil: 1 }
    }
  );
};

// Method to increment views
newsSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Virtual for total reactions
newsSchema.virtual('totalReactions').get(function() {
  return (this.reactions.love.length || 0) +
         (this.reactions.fear.length || 0) +
         (this.reactions.rune.length || 0);
});

module.exports = mongoose.model('News', newsSchema);