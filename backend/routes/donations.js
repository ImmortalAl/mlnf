const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');
const Web3 = require('web3');
const { authenticateToken } = require('./auth');

// PayPal environment setup
const paypalEnvironment = process.env.PAYPAL_MODE === 'live' 
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

// Web3 setup for Ethereum
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

// Donation model (simplified - you might want to create a separate model file)
const Donation = require('mongoose').model('Donation', new require('mongoose').Schema({
  amount: Number,
  currency: String,
  method: {
    type: String,
    enum: ['stripe', 'paypal', 'bitcoin', 'ethereum']
  },
  donor: {
    userId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    message: String
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: Object
}, { timestamps: true }));

// GET /api/donations
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const donations = await Donation.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donor.userId', 'username avatar')
      .lean();

    const total = await Donation.countDocuments({ status: 'completed' });

    res.json({
      donations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Donations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// POST /api/donations/stripe
router.post('/stripe', async (req, res) => {
  try {
    const { amount, name, email, message, userId } = req.body;

    if (amount < 100) { // Minimum $1
      return res.status(400).json({ error: 'Minimum donation is $1' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Donation to Much Love, No Fear',
            description: 'Thank you for supporting our community!'
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/donations?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/donations?payment=cancelled`,
      metadata: {
        type: 'donation',
        name,
        email,
        message,
        userId: userId || 'anonymous'
      }
    });

    // Create pending donation record
    await Donation.create({
      amount: amount / 100,
      currency: 'USD',
      method: 'stripe',
      donor: {
        userId: userId || null,
        name,
        email,
        message
      },
      transactionId: session.id,
      status: 'pending'
    });

    res.json({ 
      sessionId: session.id,
      checkoutUrl: session.url 
    });
  } catch (error) {
    console.error('Stripe donation error:', error);
    res.status(500).json({ error: 'Failed to create donation session' });
  }
});

// POST /api/donations/stripe-webhook
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
      
      if (session.metadata.type === 'donation') {
        // Update donation status
        await Donation.findOneAndUpdate(
          { transactionId: session.id },
          { status: 'completed' }
        );
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// POST /api/donations/paypal
router.post('/paypal', async (req, res) => {
  try {
    const { amount, name, email, message, userId } = req.body;

    if (amount < 1) {
      return res.status(400).json({ error: 'Minimum donation is $1' });
    }

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        },
        description: 'Donation to Much Love, No Fear',
        custom_id: JSON.stringify({ name, email, message, userId })
      }],
      application_context: {
        brand_name: 'Much Love, No Fear',
        landing_page: 'NO_PREFERENCE',
        return_url: `${process.env.CLIENT_URL}/donations?payment=success`,
        cancel_url: `${process.env.CLIENT_URL}/donations?payment=cancelled`
      }
    });

    const order = await paypalClient.execute(request);
    
    // Create pending donation record
    await Donation.create({
      amount,
      currency: 'USD',
      method: 'paypal',
      donor: {
        userId: userId || null,
        name,
        email,
        message
      },
      transactionId: order.result.id,
      status: 'pending'
    });

    res.json({
      orderId: order.result.id,
      approveUrl: order.result.links.find(link => link.rel === 'approve').href
    });
  } catch (error) {
    console.error('PayPal donation error:', error);
    res.status(500).json({ error: 'Failed to create PayPal donation' });
  }
});

// POST /api/donations/paypal/capture
router.post('/paypal/capture', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Capture PayPal order
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    
    const capture = await paypalClient.execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      // Update donation status
      await Donation.findOneAndUpdate(
        { transactionId: orderId },
        { status: 'completed' }
      );

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
});

// GET /api/donations/bitcoin/address
router.get('/bitcoin/address', async (req, res) => {
  try {
    // This uses the Blockonomics API separately from the main blockonomics routes
    const response = await axios.post(
      'https://www.blockonomics.co/api/new_address',
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLOCKONOMICS_API_KEY}`
        }
      }
    );

    res.json({ 
      address: response.data.address,
      qrCode: `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=bitcoin:${response.data.address}`
    });
  } catch (error) {
    console.error('Bitcoin address error:', error);
    res.status(500).json({ error: 'Failed to generate Bitcoin address' });
  }
});

// GET /api/donations/ethereum/address
router.get('/ethereum/address', (req, res) => {
  res.json({ 
    address: process.env.ETH_WALLET_ADDRESS,
    qrCode: `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=ethereum:${process.env.ETH_WALLET_ADDRESS}`
  });
});

// POST /api/donations/crypto
router.post('/crypto', async (req, res) => {
  try {
    const { amount, currency, name, email, message, userId, transactionHash } = req.body;

    // Create donation record for crypto
    const donation = await Donation.create({
      amount,
      currency: currency.toUpperCase(),
      method: currency.toLowerCase(),
      donor: {
        userId: userId || null,
        name,
        email,
        message
      },
      transactionId: transactionHash,
      status: 'pending',
      metadata: {
        transactionHash,
        network: currency === 'bitcoin' ? 'mainnet' : 'ethereum'
      }
    });

    res.json({
      message: 'Donation recorded. It will be confirmed once the transaction is verified.',
      donationId: donation._id
    });
  } catch (error) {
    console.error('Crypto donation error:', error);
    res.status(500).json({ error: 'Failed to record donation' });
  }
});

// GET /api/donations/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalDonations: { $count: {} },
          avgDonation: { $avg: '$amount' }
        }
      }
    ]);

    const methodStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$method',
          count: { $count: {} },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const recentDonors = await Donation.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('donor.userId', 'username avatar')
      .select('donor amount createdAt');

    res.json({
      overall: stats[0] || { totalAmount: 0, totalDonations: 0, avgDonation: 0 },
      byMethod: methodStats,
      recentDonors
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch donation stats' });
  }
});

// GET /api/donations/goal
router.get('/goal', async (req, res) => {
  try {
    // Monthly goal (you can make this configurable)
    const monthlyGoal = 1000;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyStats = await Donation.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        } 
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const raised = monthlyStats[0]?.totalAmount || 0;
    const percentage = Math.min((raised / monthlyGoal) * 100, 100);

    res.json({
      goal: monthlyGoal,
      raised,
      percentage: Math.round(percentage),
      remaining: Math.max(monthlyGoal - raised, 0)
    });
  } catch (error) {
    console.error('Goal error:', error);
    res.status(500).json({ error: 'Failed to fetch donation goal' });
  }
});

module.exports = router;
