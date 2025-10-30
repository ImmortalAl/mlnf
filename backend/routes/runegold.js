const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

// PayPal environment setup
const paypalEnvironment = process.env.PAYPAL_MODE === 'live' 
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

// Runegold packages
const runegoldPackages = {
  '1000': { amount: 1000, price: 10, stripePriceId: process.env.STRIPE_PRICE_ID_RUNEGOLD_1000 },
  '5000': { amount: 5000, price: 45, stripePriceId: process.env.STRIPE_PRICE_ID_RUNEGOLD_5000 },
  '10000': { amount: 10000, price: 85, stripePriceId: process.env.STRIPE_PRICE_ID_RUNEGOLD_10000 }
};

// GET /api/runegold/balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('runegoldBalance');
    res.json({ balance: user.runegoldBalance });
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// GET /api/runegold/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(req.user.userId).select('runeJourney');
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const history = user.runeJourney
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(startIndex, endIndex);
    
    res.json({
      history,
      totalPages: Math.ceil(user.runeJourney.length / limit),
      currentPage: page,
      total: user.runeJourney.length
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/runegold/purchase/stripe
router.post('/purchase/stripe', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.userId;
    
    const package = runegoldPackages[packageId];
    if (!package) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: package.stripePriceId,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/dashboard?payment=success&amount=${package.amount}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?payment=cancelled`,
      metadata: {
        userId,
        runegoldAmount: package.amount,
        packageId
      }
    });

    res.json({ 
      sessionId: session.id,
      checkoutUrl: session.url 
    });
  } catch (error) {
    console.error('Stripe purchase error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

// POST /api/runegold/stripe-webhook
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, runegoldAmount, packageId } = session.metadata;

      // Award Runegold to user
      const user = await User.findById(userId);
      await user.updateRunegoldBalance(
        parseInt(runegoldAmount),
        'purchase',
        `Purchased ${runegoldAmount} Runegold via Stripe`
      );

      // Send notification
      await user.addNotification({
        type: 'runegold',
        message: `You received ${runegoldAmount} Runegold from your purchase!`
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// POST /api/runegold/purchase/paypal
router.post('/purchase/paypal', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.userId;
    
    const package = runegoldPackages[packageId];
    if (!package) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: package.price.toFixed(2)
        },
        description: `${package.amount} Runegold`,
        custom_id: JSON.stringify({ userId, runegoldAmount: package.amount })
      }],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.CLIENT_URL}/dashboard?payment=cancelled`
      }
    });

    const order = await paypalClient.execute(request);
    
    res.json({
      orderId: order.result.id,
      approveUrl: order.result.links.find(link => link.rel === 'approve').href
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// POST /api/runegold/purchase/paypal/capture
router.post('/purchase/paypal/capture', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Capture PayPal order
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    
    const capture = await paypalClient.execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      const customData = JSON.parse(capture.result.purchase_units[0].custom_id);
      const { userId, runegoldAmount } = customData;

      // Award Runegold to user
      const user = await User.findById(userId);
      await user.updateRunegoldBalance(
        runegoldAmount,
        'purchase',
        `Purchased ${runegoldAmount} Runegold via PayPal`
      );

      // Send notification
      await user.addNotification({
        type: 'runegold',
        message: `You received ${runegoldAmount} Runegold from your purchase!`
      });

      res.json({ 
        success: true,
        runegoldAmount 
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
});

// POST /api/runegold/transfer
router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    const { recipientUsername, amount } = req.body;
    const senderId = req.user.userId;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findOne({ username: recipientUsername })
    ]);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (sender._id.equals(recipient._id)) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    if (sender.runegoldBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        current: sender.runegoldBalance,
        required: amount
      });
    }

    // Perform transfer
    await sender.updateRunegoldBalance(
      -amount,
      'transfer_sent',
      `Sent ${amount} Runegold to ${recipient.username}`
    );

    await recipient.updateRunegoldBalance(
      amount,
      'transfer_received',
      `Received ${amount} Runegold from ${sender.username}`
    );

    // Send notification to recipient
    await recipient.addNotification({
      type: 'runegold',
      message: `${sender.username} sent you ${amount} Runegold!`,
      relatedUser: senderId
    });

    res.json({
      message: 'Transfer successful',
      newBalance: sender.runegoldBalance - amount
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer Runegold' });
  }
});

// POST /api/runegold/badge/purchase
router.post('/badge/purchase', authenticateToken, async (req, res) => {
  try {
    const { badgeType, customName, customDescription } = req.body;
    const userId = req.user.userId;
    const badgeCost = 100;

    const user = await User.findById(userId);

    if (user.runegoldBalance < badgeCost) {
      return res.status(400).json({ 
        error: 'Insufficient Runegold balance',
        required: badgeCost,
        current: user.runegoldBalance
      });
    }

    // Check if user already has this badge type
    if (badgeType !== 'custom') {
      const hasBadge = user.badges.some(badge => badge.type === badgeType);
      if (hasBadge) {
        return res.status(400).json({ error: 'You already have this badge' });
      }
    }

    // Deduct Runegold and add badge
    await user.updateRunegoldBalance(
      -badgeCost,
      'badge_purchase',
      `Purchased ${badgeType} badge`
    );

    const newBadge = {
      type: badgeType,
      name: customName || badgeType.charAt(0).toUpperCase() + badgeType.slice(1),
      description: customDescription || `${badgeType} badge earned through dedication`
    };

    user.badges.push(newBadge);
    await user.save();

    res.json({
      message: 'Badge purchased successfully',
      badge: newBadge,
      runegoldSpent: badgeCost
    });
  } catch (error) {
    console.error('Badge purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase badge' });
  }
});

// GET /api/runegold/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { period = 'all', limit = 20 } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'daily':
        dateFilter = { 
          createdAt: { 
            $gte: new Date(now.setHours(0, 0, 0, 0)) 
          } 
        };
        break;
      case 'weekly':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter = { createdAt: { $gte: weekAgo } };
        break;
      case 'monthly':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = { createdAt: { $gte: monthAgo } };
        break;
    }

    const topUsers = await User.find(dateFilter)
      .sort({ runegoldBalance: -1 })
      .limit(parseInt(limit))
      .select('username avatar runegoldBalance badges');

    res.json(topUsers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/runegold/packages
router.get('/packages', (req, res) => {
  const packages = Object.entries(runegoldPackages).map(([id, details]) => ({
    id,
    amount: details.amount,
    price: details.price,
    bonus: details.amount > 1000 ? Math.floor((details.amount - (details.price * 100)) / 100) : 0
  }));

  res.json(packages);
});

// POST /api/runegold/claim/referral
router.post('/claim/referral', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('referredBy');

    if (!user.referredBy) {
      return res.status(400).json({ error: 'No referral bonus available' });
    }

    // Check if referral bonus already claimed
    const referralClaimed = user.runeJourney.some(
      entry => entry.event === 'referral_bonus'
    );

    if (referralClaimed) {
      return res.status(400).json({ error: 'Referral bonus already claimed' });
    }

    // Award referral bonus
    const referralBonus = 50;
    await user.updateRunegoldBalance(
      referralBonus,
      'referral_bonus',
      `Welcome bonus from referral by ${user.referredBy.username}`
    );

    res.json({
      message: 'Referral bonus claimed',
      runegoldEarned: referralBonus
    });
  } catch (error) {
    console.error('Referral claim error:', error);
    res.status(500).json({ error: 'Failed to claim referral bonus' });
  }
});

module.exports = router;
