const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

// Blockonomics API configuration
const BLOCKONOMICS_API_URL = 'https://www.blockonomics.co/api';
const API_KEY = process.env.BLOCKONOMICS_API_KEY;

// Generate new Bitcoin address
router.post('/generate-address', [
  body('amount').isFloat({ min: 0.0001 }).withMessage('Amount must be at least 0.0001 BTC'),
  body('name').optional().trim(),
  body('email').optional().isEmail(),
  body('message').optional().isLength({ max: 500 }),
  body('purpose').optional().isIn(['donation', 'runegold']).withMessage('Invalid purpose')
], async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(503).json({ error: 'Bitcoin payments are not configured' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { amount, name, email, message, purpose } = req.body;
    
    // Generate new address from Blockonomics
    const response = await axios.post(
      `${BLOCKONOMICS_API_URL}/new_address`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const address = response.data.address;
    
    // Store payment request (in production, save to database)
    const paymentId = crypto.randomBytes(16).toString('hex');
    
    // In production, you would save this to database:
    // const payment = {
    //   paymentId,
    //   address,
    //   amount,
    //   purpose: purpose || 'donation',
    //   name: name || 'Anonymous',
    //   email: email || '',
    //   message: message || '',
    //   status: 'pending',
    //   createdAt: new Date()
    // };
    
    console.log('Bitcoin payment request created:', {
      paymentId,
      address,
      amount,
      purpose: purpose || 'donation'
    });
    
    res.json({
      paymentId,
      address,
      amount,
      qrCode: `bitcoin:${address}?amount=${amount}`,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Generate BTC address error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate Bitcoin address' });
  }
});

// Check payment status
router.get('/check-payment/:address', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(503).json({ error: 'Bitcoin payments are not configured' });
    }
    
    const { address } = req.params;
    
    // Get address balance from Blockonomics
    const response = await axios.get(
      `${BLOCKONOMICS_API_URL}/balance`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        params: {
          addr: address
        }
      }
    );
    
    const balance = response.data.response[0];
    
    if (!balance) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const confirmed = balance.confirmed || 0;
    const unconfirmed = balance.unconfirmed || 0;
    
    res.json({
      address,
      confirmed: confirmed / 100000000, // Convert satoshis to BTC
      unconfirmed: unconfirmed / 100000000,
      total: (confirmed + unconfirmed) / 100000000,
      isPaid: confirmed > 0 || unconfirmed > 0
    });
  } catch (error) {
    console.error('Check BTC payment error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Webhook callback from Blockonomics
router.post('/webhook', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(503).json({ error: 'Bitcoin payments are not configured' });
    }
    
    // Verify callback secret
    const secret = req.query.secret;
    if (secret !== process.env.BLOCKONOMICS_CALLBACK_SECRET) {
      return res.status(401).json({ error: 'Invalid callback secret' });
    }
    
    const { addr, status, value, txid } = req.body;
    
    // Status codes:
    // 0 = unconfirmed
    // 1 = partially confirmed
    // 2 = confirmed
    
    console.log('Bitcoin payment webhook received:', {
      address: addr,
      status,
      value: value / 100000000, // Convert to BTC
      txid,
      timestamp: new Date()
    });
    
    // In production, update payment status in database
    // and process the payment (credit Runegold, record donation, etc.)
    
    if (status === 2) {
      // Payment confirmed
      // TODO: Process confirmed payment
      console.log('Bitcoin payment confirmed:', {
        address: addr,
        amount: value / 100000000,
        txid
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('BTC webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get current Bitcoin price
router.get('/price', async (req, res) => {
  try {
    const response = await axios.get('https://www.blockonomics.co/api/price', {
      params: {
        currency: 'USD'
      }
    });
    
    const priceUSD = response.data.price;
    
    res.json({
      currency: 'USD',
      price: priceUSD,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get BTC price error:', error);
    res.status(500).json({ error: 'Failed to get Bitcoin price' });
  }
});

// Convert USD to BTC
router.get('/convert', async (req, res) => {
  try {
    const { amount } = req.query;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const response = await axios.get('https://www.blockonomics.co/api/price', {
      params: {
        currency: 'USD'
      }
    });
    
    const priceUSD = response.data.price;
    const btcAmount = parseFloat(amount) / priceUSD;
    
    res.json({
      usd: parseFloat(amount),
      btc: btcAmount.toFixed(8),
      rate: priceUSD
    });
  } catch (error) {
    console.error('Convert USD to BTC error:', error);
    res.status(500).json({ error: 'Failed to convert amount' });
  }
});

// Get transaction details
router.get('/transaction/:txid', async (req, res) => {
  try {
    const { txid } = req.params;
    
    // Use blockchain.info API as fallback
    const response = await axios.get(`https://blockchain.info/rawtx/${txid}`);
    
    const tx = response.data;
    
    res.json({
      txid: tx.hash,
      confirmations: tx.block_height ? 1 : 0,
      time: tx.time,
      inputs: tx.inputs.length,
      outputs: tx.out.length,
      total: tx.out.reduce((sum, output) => sum + output.value, 0) / 100000000
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction details' });
  }
});

module.exports = router;