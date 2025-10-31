const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const { ethers } = require('ethers');

// Configure PayPal
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
  });
}

// Stripe donation
router.post('/stripe', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('name').optional().trim(),
  body('email').optional().isEmail(),
  body('message').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe donations are not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { amount, name, email, message } = req.body;
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: 'Donation to Much Love, No Fear',
      metadata: {
        name: name || 'Anonymous',
        email: email || '',
        message: message || '',
        type: 'donation'
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Stripe donation error:', error);
    res.status(500).json({ error: 'Failed to create donation payment' });
  }
});

// Confirm Stripe donation
router.post('/stripe/confirm', [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
], async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe donations are not configured' });
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
    
    const { name, message } = paymentIntent.metadata;
    
    // Log donation (you could save to database here)
    console.log('Donation received:', {
      amount: paymentIntent.amount / 100,
      name,
      message,
      timestamp: new Date()
    });
    
    res.json({
      message: 'Donation successful',
      amount: paymentIntent.amount / 100,
      name: name || 'Anonymous'
    });
  } catch (error) {
    console.error('Stripe confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm donation' });
  }
});

// PayPal donation
router.post('/paypal', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('name').optional().trim(),
  body('email').optional().isEmail(),
  body('message').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: 'PayPal donations are not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { amount, name, email, message } = req.body;
    
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/donations/success`,
        cancel_url: `${process.env.CLIENT_URL}/donations/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: 'Donation to Much Love, No Fear',
            price: parseFloat(amount).toFixed(2),
            currency: 'USD',
            quantity: 1
          }]
        },
        amount: {
          currency: 'USD',
          total: parseFloat(amount).toFixed(2)
        },
        description: 'Support Much Love, No Fear',
        custom: JSON.stringify({
          name: name || 'Anonymous',
          email: email || '',
          message: message || '',
          type: 'donation'
        })
      }]
    };
    
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error('PayPal create error:', error);
        return res.status(500).json({ error: 'Failed to create PayPal donation' });
      }
      
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
      
      res.json({
        paymentId: payment.id,
        approvalUrl: approvalUrl ? approvalUrl.href : null
      });
    });
  } catch (error) {
    console.error('PayPal donation error:', error);
    res.status(500).json({ error: 'Failed to create PayPal donation' });
  }
});

// Execute PayPal donation
router.post('/paypal/execute', [
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('payerId').notEmpty().withMessage('Payer ID is required')
], async (req, res) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ error: 'PayPal donations are not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { paymentId, payerId } = req.body;
    
    const execute_payment_json = {
      payer_id: payerId
    };
    
    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
      if (error) {
        console.error('PayPal execute error:', error);
        return res.status(500).json({ error: 'Failed to execute PayPal donation' });
      }
      
      if (payment.state !== 'approved') {
        return res.status(400).json({ error: 'Payment not approved' });
      }
      
      const customData = JSON.parse(payment.transactions[0].custom);
      const amount = parseFloat(payment.transactions[0].amount.total);
      
      // Log donation
      console.log('Donation received:', {
        amount,
        name: customData.name,
        message: customData.message,
        timestamp: new Date()
      });
      
      res.json({
        message: 'Donation successful',
        amount,
        name: customData.name || 'Anonymous'
      });
    });
  } catch (error) {
    console.error('PayPal execute error:', error);
    res.status(500).json({ error: 'Failed to execute PayPal donation' });
  }
});

// Get Ethereum wallet address
router.get('/ethereum/address', (req, res) => {
  try {
    if (!process.env.ETH_WALLET_ADDRESS) {
      return res.status(503).json({ error: 'Ethereum donations are not configured' });
    }
    
    res.json({
      address: process.env.ETH_WALLET_ADDRESS,
      network: 'Ethereum Mainnet'
    });
  } catch (error) {
    console.error('Get ETH address error:', error);
    res.status(500).json({ error: 'Failed to get Ethereum address' });
  }
});

// Verify Ethereum transaction
router.post('/ethereum/verify', [
  body('txHash').notEmpty().withMessage('Transaction hash is required'),
  body('name').optional().trim(),
  body('message').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    if (!process.env.ETH_WALLET_ADDRESS) {
      return res.status(503).json({ error: 'Ethereum donations are not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { txHash, name, message } = req.body;
    
    // Create provider (using Infura or other provider)
    let provider;
    try {
      provider = ethers.getDefaultProvider('mainnet');
    } catch (e) {
      // Fallback if no provider configured
      return res.json({
        message: 'Transaction received',
        txHash,
        note: 'Manual verification required'
      });
    }
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.status(400).json({ error: 'Transaction not found or not confirmed yet' });
    }
    
    if (receipt.to?.toLowerCase() !== process.env.ETH_WALLET_ADDRESS.toLowerCase()) {
      return res.status(400).json({ error: 'Transaction not sent to correct address' });
    }
    
    // Log donation
    console.log('Ethereum donation received:', {
      txHash,
      name: name || 'Anonymous',
      message: message || '',
      timestamp: new Date()
    });
    
    res.json({
      message: 'Ethereum donation verified',
      txHash,
      name: name || 'Anonymous',
      confirmed: true
    });
  } catch (error) {
    console.error('Verify ETH transaction error:', error);
    res.status(500).json({ error: 'Failed to verify Ethereum transaction' });
  }
});

// Get donation statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    // This would query a donations database table if implemented
    // For now, return placeholder data
    res.json({
      total: 0,
      count: 0,
      methods: {
        stripe: 0,
        paypal: 0,
        bitcoin: 0,
        ethereum: 0
      },
      recentDonations: []
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ error: 'Failed to get donation statistics' });
  }
});

module.exports = router;