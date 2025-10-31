const mongoose = require('mongoose');

const runegoldTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['purchase', 'spend', 'earn', 'tip', 'reward', 'refund', 'admin_inject', 'admin_withdraw'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    paymentMethod: String,
    paymentId: String,
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'metadata.itemType'
    },
    itemType: {
      type: String,
      enum: ['Video', 'Comment', 'User', 'Badge', 'Subscription']
    },
    previousBalance: Number,
    newBalance: Number
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const runegoldPoolSchema = new mongoose.Schema({
  reserve: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCirculation: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTipped: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRewarded: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [runegoldTransactionSchema],
  pricing: {
    pack1000: {
      amount: 1000,
      price: 10, // USD
      currency: 'USD'
    },
    pack5000: {
      amount: 5000,
      price: 45, // USD
      currency: 'USD'
    },
    pack10000: {
      amount: 10000,
      price: 85, // USD
      currency: 'USD'
    }
  },
  spending: {
    boostVideo: {
      cost: 50,
      duration: 1, // hours
      description: 'Boost video in carousel for 1 hour'
    },
    highlightComment: {
      cost: 20,
      duration: 24, // hours
      description: 'Sticky comment for 24 hours'
    },
    badge: {
      cost: 100,
      description: 'Custom or themed badge'
    },
    exclusiveContent: {
      cost: 200,
      description: 'Unlock private content'
    },
    tipMin: {
      cost: 10,
      description: 'Minimum tip amount'
    },
    tipMax: {
      cost: 100,
      description: 'Maximum tip amount'
    },
    subscriptionMonthly: {
      cost: 500,
      description: 'Premium subscription per month'
    }
  },
  promotions: [{
    name: String,
    description: String,
    amount: Number,
    startDate: Date,
    endDate: Date,
    maxUsers: Number,
    usedCount: {
      type: Number,
      default: 0
    },
    claimedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    code: {
      type: String,
      unique: true,
      sparse: true
    }
  }],
  statistics: {
    dailyVolume: [{
      date: Date,
      purchased: Number,
      spent: Number,
      tipped: Number,
      activeUsers: Number
    }],
    monthlyReport: [{
      month: String, // YYYY-MM format
      revenue: Number,
      transactions: Number,
      newUsers: Number,
      topSpenders: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        amount: Number
      }]
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
runegoldPoolSchema.index({ 'transactions.user': 1 });
runegoldPoolSchema.index({ 'transactions.createdAt': -1 });
runegoldPoolSchema.index({ 'transactions.type': 1 });
runegoldPoolSchema.index({ 'promotions.code': 1 });
runegoldPoolSchema.index({ 'promotions.isActive': 1 });

// Method to add transaction
runegoldPoolSchema.methods.addTransaction = async function(type, userId, amount, description, metadata = {}) {
  const transaction = {
    type,
    user: userId,
    amount,
    description,
    metadata,
    status: 'completed'
  };

  this.transactions.push(transaction);

  // Update totals based on transaction type
  switch (type) {
    case 'purchase':
      this.totalPurchased += amount;
      this.totalCirculation += amount;
      break;
    case 'spend':
      this.totalSpent += amount;
      break;
    case 'tip':
      this.totalTipped += amount;
      break;
    case 'reward':
      this.totalRewarded += amount;
      this.totalCirculation += amount;
      break;
    case 'admin_inject':
      this.reserve += amount;
      this.totalCirculation += amount;
      break;
    case 'admin_withdraw':
      this.reserve -= amount;
      this.totalCirculation -= amount;
      break;
  }

  // Keep only last 10000 transactions
  if (this.transactions.length > 10000) {
    this.transactions = this.transactions.slice(-10000);
  }

  this.lastUpdated = new Date();
  return this.save();
};

// Method to inject Runegold from reserve
runegoldPoolSchema.methods.injectFromReserve = async function(amount, description) {
  if (this.reserve < amount) {
    throw new Error('Insufficient reserve balance');
  }

  this.reserve -= amount;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to add to reserve
runegoldPoolSchema.methods.addToReserve = async function(amount, description) {
  this.reserve += amount;
  this.lastUpdated = new Date();

  // Log as admin injection
  await this.addTransaction('admin_inject', null, amount, description);

  return this.save();
};

// Method to create promotion
runegoldPoolSchema.methods.createPromotion = async function(promotionData) {
  const promotion = {
    ...promotionData,
    code: promotionData.code || this.generatePromoCode(),
    isActive: true,
    usedCount: 0,
    claimedBy: []
  };

  this.promotions.push(promotion);
  return this.save();
};

// Method to claim promotion
runegoldPoolSchema.methods.claimPromotion = async function(code, userId) {
  const promotion = this.promotions.find(p =>
    p.code === code &&
    p.isActive &&
    (!p.endDate || p.endDate > new Date()) &&
    (!p.maxUsers || p.usedCount < p.maxUsers)
  );

  if (!promotion) {
    throw new Error('Invalid or expired promotion code');
  }

  if (promotion.claimedBy.includes(userId)) {
    throw new Error('Promotion already claimed by this user');
  }

  promotion.claimedBy.push(userId);
  promotion.usedCount += 1;

  if (promotion.maxUsers && promotion.usedCount >= promotion.maxUsers) {
    promotion.isActive = false;
  }

  // Deduct from reserve if needed
  if (this.reserve < promotion.amount) {
    throw new Error('Insufficient reserve for promotion');
  }

  this.reserve -= promotion.amount;
  await this.save();

  return promotion.amount;
};

// Method to generate promo code
runegoldPoolSchema.methods.generatePromoCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MLNF';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Method to get daily statistics
runegoldPoolSchema.methods.updateDailyStatistics = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Get today's transactions
  const todayTransactions = this.transactions.filter(t =>
    t.createdAt >= today && t.createdAt <= endOfDay
  );

  const dailyStat = {
    date: today,
    purchased: todayTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0),
    spent: todayTransactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0),
    tipped: todayTransactions
      .filter(t => t.type === 'tip')
      .reduce((sum, t) => sum + t.amount, 0),
    activeUsers: new Set(todayTransactions.map(t => t.user?.toString()).filter(Boolean)).size
  };

  // Update or add daily stat
  const existingIndex = this.statistics.dailyVolume.findIndex(
    s => s.date.toDateString() === today.toDateString()
  );

  if (existingIndex >= 0) {
    this.statistics.dailyVolume[existingIndex] = dailyStat;
  } else {
    this.statistics.dailyVolume.push(dailyStat);
  }

  // Keep only last 365 days
  if (this.statistics.dailyVolume.length > 365) {
    this.statistics.dailyVolume = this.statistics.dailyVolume.slice(-365);
  }

  return this.save();
};

// Static method to get current pool
runegoldPoolSchema.statics.getCurrent = async function() {
  let pool = await this.findOne();
  if (!pool) {
    pool = await this.create({
      reserve: parseInt(process.env.RUNEGOLD_INITIAL_RESERVE) || 0
    });
  }
  return pool;
};

// Method to validate purchase
runegoldPoolSchema.methods.validatePurchase = function(packType) {
  const validPacks = ['pack1000', 'pack5000', 'pack10000'];
  if (!validPacks.includes(packType)) {
    throw new Error('Invalid pack type');
  }

  const pack = this.pricing[packType];
  if (!pack) {
    throw new Error('Pack configuration not found');
  }

  return {
    amount: pack.amount,
    price: pack.price,
    currency: pack.currency
  };
};

// Method to get pool statistics
runegoldPoolSchema.methods.getStatistics = function() {
  return {
    reserve: this.reserve,
    totalCirculation: this.totalCirculation,
    totalPurchased: this.totalPurchased,
    totalSpent: this.totalSpent,
    totalTipped: this.totalTipped,
    totalRewarded: this.totalRewarded,
    activePromotions: this.promotions.filter(p => p.isActive).length,
    transactionCount: this.transactions.length,
    lastUpdated: this.lastUpdated
  };
};

module.exports = mongoose.model('RunegoldPool', runegoldPoolSchema);