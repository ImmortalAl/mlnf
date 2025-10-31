const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const User = require('../models/User');
const Video = require('../models/Video');
const { authMiddleware } = require('./auth');

// Configure PayPal
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
  });
}

// Runegold packages
const PACKAGES = {
  small: { runegold: 1000, price: 10.00, usd: 10 },
  medium: { runegold: 5000, price: 45.00, usd: 45 },
  large: { runegold: 10000, price: 85.00, usd: 85 }
};

// Get Runegold balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('runegoldBalance runegoldJourney');
    
    res.json({
      balance: user.runegoldBalance,
      journey: user.runegoldJourney.slice(-10) // Last 10 transactions
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Get full Runegold journey
router.get('/journey', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(req.user._id)
      .select('runegoldJourney')
      .populate('runegoldJourney.relatedId');
    
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    
    const journey = user.runegoldJourney.slice(start, end);
    
    res.json({
      journey,
      pagination: {
        total: user.runegoldJourney.length,
        page: parseInt(page),
        pages: Math.ceil(user.runegoldJourney.length / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get journey error:', error);
    res.status(500).json({ error: 'Failed to get journey' });
  }
});

// Purchase Runegold - Stripe
router.post('/purchase/stripe', authMiddleware, [
  body('package').isIn(['small', 'medium', 'large']).withMessage('Invalid package')
], async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe payment is not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { package: packageName } = req.body;
    const packageInfo = PACKAGES[packageName];
    
    if (!packageInfo) {
      return res.status(400).json({ error: 'Invalid package' });
    }
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(packageInfo.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString(),
        package: packageName,
        runegold: packageInfo.runegold
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      package: packageInfo
    });
  } catch (error) {
    console.error('Stripe purchase error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm Stripe payment
router.post('/purchase/stripe/confirm', authMiddleware, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
], async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe payment is not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { paymentIntentId } = req.body;
    
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }
    
    const { userId, runegold } = paymentIntent.metadata;
    
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Credit Runegold to user
    const user = await User.findById(userId);
    const result = await user.addRunegoldTransaction(
      'purchase',
      parseInt(runegold),
      `Purchased ${runegold} Runegold via Stripe`
    );
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('runegoldTransaction', {
      userId: user._id,
      type: 'purchase',
      amount: parseInt(runegold),
      newBalance: result.newBalance
    });
    
    res.json({
      message: 'Purchase successful',
      balance: result.newBalance,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Stripe confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Purchase Runegold - PayPal
router.post('/purchase/paypal', authMiddleware, [
  body('package').isIn(['small', 'medium', 'large']).withMessage('Invalid package')
], async (req, res) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: 'PayPal payment is not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { package: packageName } = req.body;
    const packageInfo = PACKAGES[packageName];
    
    if (!packageInfo) {
      return res.status(400).json({ error: 'Invalid package' });
    }
    
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/runegold/success`,
        cancel_url: `${process.env.CLIENT_URL}/runegold/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: `${packageInfo.runegold} Runegold`,
            sku: packageName,
            price: packageInfo.price.toFixed(2),
            currency: 'USD',
            quantity: 1
          }]
        },
        amount: {
          currency: 'USD',
          total: packageInfo.price.toFixed(2)
        },
        description: `Purchase ${packageInfo.runegold} Runegold`,
        custom: JSON.stringify({
          userId: req.user._id.toString(),
          package: packageName,
          runegold: packageInfo.runegold
        })
      }]
    };
    
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error('PayPal create error:', error);
        return res.status(500).json({ error: 'Failed to create PayPal payment' });
      }
      
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
      
      res.json({
        paymentId: payment.id,
        approvalUrl: approvalUrl ? approvalUrl.href : null
      });
    });
  } catch (error) {
    console.error('PayPal purchase error:', error);
    res.status(500).json({ error: 'Failed to create PayPal payment' });
  }
});

// Execute PayPal payment
router.post('/purchase/paypal/execute', authMiddleware, [
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('payerId').notEmpty().withMessage('Payer ID is required')
], async (req, res) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: 'PayPal payment is not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { paymentId, payerId } = req.body;
    
    const execute_payment_json = {
      payer_id: payerId
    };
    
    paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal execute error:', error);
        return res.status(500).json({ error: 'Failed to execute PayPal payment' });
      }
      
      if (payment.state !== 'approved') {
        return res.status(400).json({ error: 'Payment not approved' });
      }
      
      const customData = JSON.parse(payment.transactions[0].custom);
      const { userId, runegold } = customData;
      
      if (userId !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Credit Runegold to user
      const user = await User.findById(userId);
      const result = await user.addRunegoldTransaction(
        'purchase',
        parseInt(runegold),
        `Purchased ${runegold} Runegold via PayPal`
      );
      
      // Emit socket event
      const io = req.app.get('io');
      io.emit('runegoldTransaction', {
        userId: user._id,
        type: 'purchase',
        amount: parseInt(runegold),
        newBalance: result.newBalance
      });
      
      res.json({
        message: 'Purchase successful',
        balance: result.newBalance,
        transaction: result.transaction
      });
    });
  } catch (error) {
    console.error('PayPal execute error:', error);
    res.status(500).json({ error: 'Failed to execute PayPal payment' });
  }
});

// Boost video
router.post('/spend/boost/:videoId', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;
    const BOOST_COST = 50;
    const BOOST_HOURS = 1;
    
    const user = await User.findById(req.user._id);
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    if (user.runegoldBalance < BOOST_COST) {
      return res.status(400).json({ error: 'Insufficient Runegold balance' });
    }
    
    // Boost video
    await video.boostVideo(req.user._id, BOOST_HOURS);
    
    // Deduct Runegold
    const result = await user.addRunegoldTransaction(
      'spend',
      BOOST_COST,
      `Boosted video: ${video.title}`,
      video._id,
      'Video'
    );
    
    // Add to user's boosted videos
    user.boostedVideos.push({
      video: video._id,
      boostedAt: new Date(),
      expiresAt: video.boostExpiresAt
    });
    await user.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('runegoldTransaction', {
      userId: user._id,
      type: 'spend',
      amount: BOOST_COST,
      newBalance: result.newBalance
    });
    
    io.emit('videoBoost', {
      videoId: video._id,
      boostExpiresAt: video.boostExpiresAt
    });
    
    res.json({
      message: 'Video boosted successfully',
      balance: result.newBalance,
      boostExpiresAt: video.boostExpiresAt
    });
  } catch (error) {
    console.error('Boost video error:', error);
    res.status(500).json({ error: error.message || 'Failed to boost video' });
  }
});

// Highlight comment
router.post('/spend/highlight/:videoId/:commentId', authMiddleware, async (req, res) => {
  try {
    const { videoId, commentId } = req.params;
    const HIGHLIGHT_COST = 20;
    
    const user = await User.findById(req.user._id);
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    if (user.runegoldBalance < HIGHLIGHT_COST) {
      return res.status(400).json({ error: 'Insufficient Runegold balance' });
    }
    
    // Highlight comment
    await video.highlightComment(commentId, req.user._id);
    
    // Deduct Runegold
    const result = await user.addRunegoldTransaction(
      'spend',
      HIGHLIGHT_COST,
      `Highlighted comment on: ${video.title}`,
      video._id,
      'Video'
    );
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('runegoldTransaction', {
      userId: user._id,
      type: 'spend',
      amount: HIGHLIGHT_COST,
      newBalance: result.newBalance
    });
    
    res.json({
      message: 'Comment highlighted successfully',
      balance: result.newBalance
    });
  } catch (error) {
    console.error('Highlight comment error:', error);
    res.status(500).json({ error: error.message || 'Failed to highlight comment' });
  }
});

// Purchase badge
router.post('/spend/badge', authMiddleware, [
  body('badgeName').notEmpty().withMessage('Badge name is required'),
  body('badgeIcon').notEmpty().withMessage('Badge icon is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { badgeName, badgeIcon, badgeDescription } = req.body;
    const BADGE_COST = 100;
    
    const user = await User.findById(req.user._id);
    
    if (user.runegoldBalance < BADGE_COST) {
      return res.status(400).json({ error: 'Insufficient Runegold balance' });
    }
    
    // Check if user already has this badge
    const existingBadge = user.badges.find(b => b.name === badgeName);
    if (existingBadge) {
      return res.status(400).json({ error: 'You already have this badge' });
    }
    
    // Add badge
    user.badges.push({
      name: badgeName,
      icon: badgeIcon,
      description: badgeDescription || ''
    });
    
    // Deduct Runegold
    const result = await user.addRunegoldTransaction(
      'spend',
      BADGE_COST,
      `Purchased badge: ${badgeName}`
    );
    
    await user.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('runegoldTransaction', {
      userId: user._id,
      type: 'spend',
      amount: BADGE_COST,
      newBalance: result.newBalance
    });
    
    res.json({
      message: 'Badge purchased successfully',
      balance: result.newBalance,
      badge: user.badges[user.badges.length - 1]
    });
  } catch (error) {
    console.error('Purchase badge error:', error);
    res.status(500).json({ error: 'Failed to purchase badge' });
  }
});

// Tip user
router.post('/spend/tip/:userId', authMiddleware, [
  body('amount').isInt({ min: 10, max: 100 }).withMessage('Tip amount must be between 10 and 100 Runegold'),
  body('message').optional().isLength({ max: 200 }).withMessage('Message must be under 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId } = req.params;
    const { amount, message } = req.body;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot tip yourself' });
    }
    
    const sender = await User.findById(req.user._id);
    const recipient = await User.findById(userId);
    
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (sender.runegoldBalance < amount) {
      return res.status(400).json({ error: 'Insufficient Runegold balance' });
    }
    
    // Deduct from sender
    const senderResult = await sender.addRunegoldTransaction(
      'spend',
      amount,
      `Tipped ${recipient.username}`,
      recipient._id,
      'User'
    );
    
    // Credit to recipient
    const recipientResult = await recipient.addRunegoldTransaction(
      'receive',
      amount,
      `Received tip from ${sender.username}`,
      sender._id,
      'User'
    );
    
    // Create notification
    await recipient.addNotification(
      'runegold',
      `${sender.username} sent you a ${amount} Runegold tip${message ? `: ${message}` : ''}`,
      sender._id
    );
    
    // Emit socket events
    const io = req.app.get('io');
    io.emit('runegoldTransaction', {
      userId: sender._id,
      type: 'spend',
      amount,
      newBalance: senderResult.newBalance
    });
    
    io.emit('runegoldTransaction', {
      userId: recipient._id,
      type: 'receive',
      amount,
      newBalance: recipientResult.newBalance
    });
    
    res.json({
      message: 'Tip sent successfully',
      balance: senderResult.newBalance
    });
  } catch (error) {
    console.error('Tip user error:', error);
    res.status(500).json({ error: 'Failed to send tip' });
  }
});

// Admin: Inject Runegold
router.post('/admin/inject-runegold', authMiddleware, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, amount, reason } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add Runegold
    const result = await user.addRunegoldTransaction(
      'admin_injection',
      parseInt(amount),
      `Admin injection: ${reason}`
    );
    
    // Create notification
    await user.addNotification(
      'runegold',
      `You received ${amount} Runegold from admin: ${reason}`,
      req.user._id
    );
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('runegoldTransaction', {
      userId: user._id,
      type: 'admin_injection',
      amount: parseInt(amount),
      newBalance: result.newBalance
    });
    
    res.json({
      message: 'Runegold injected successfully',
      user: {
        id: user._id,
        username: user.username,
        newBalance: result.newBalance
      },
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Inject Runegold error:', error);
    res.status(500).json({ error: 'Failed to inject Runegold' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topUsers = await User.find({ isActive: true })
      .select('username profilePicture runegoldBalance badges')
      .sort({ runegoldBalance: -1 })
      .limit(parseInt(limit));
    
    res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;