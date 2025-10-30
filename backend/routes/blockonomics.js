const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

// Blockonomics transaction model
const BlockonomicsTransaction = require('mongoose').model('BlockonomicsTransaction', new require('mongoose').Schema({
  userId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User' },
  address: { type: String, required: true, unique: true },
  amount: { type: Number, required: true }, // Amount in satoshis
  runegoldAmount: { type: Number, required: true },
  status: {
    type: Number,
    default: -1 // -1: Pending, 0: Unconfirmed, 1: Partially Confirmed, 2: Confirmed
  },
  txid: String,
  value: Number, // Actual received value in satoshis
  timestamp: Date,
  packageId: String
}, { timestamps: true }));

// Bitcoin to USD conversion rate (you should fetch this from an API in production)
const getBTCtoUSD = async () => {
  try {
    const response = await axios.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json');
    return response.data.bpi.USD.rate_float;
  } catch (error) {
    console.error('BTC price fetch error:', error);
    return 50000; // Fallback price
  }
};

// POST /api/blockonomics/new-address
router.post('/new-address', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.userId;

    // Runegold packages with BTC prices
    const packages = {
      '1000': { runegold: 1000, usd: 10 },
      '5000': { runegold: 5000, usd: 45 },
      '10000': { runegold: 10000, usd: 85 }
    };

    const package = packages[packageId];
    if (!package) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Get BTC price and calculate amount
    const btcPrice = await getBTCtoUSD();
    const btcAmount = package.usd / btcPrice;
    const satoshiAmount = Math.round(btcAmount * 100000000); // Convert to satoshis

    // Generate new address from Blockonomics
    const response = await axios.post(
      'https://www.blockonomics.co/api/new_address',
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLOCKONOMICS_API_KEY}`
        }
      }
    );

    const btcAddress = response.data.address;

    // Save transaction record
    await BlockonomicsTransaction.create({
      userId,
      address: btcAddress,
      amount: satoshiAmount,
      runegoldAmount: package.runegold,
      packageId
    });

    // Generate payment URL and QR code
    const paymentUrl = `bitcoin:${btcAddress}?amount=${btcAmount.toFixed(8)}`;
    const qrCode = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(paymentUrl)}`;

    res.json({
      address: btcAddress,
      amount: btcAmount.toFixed(8),
      satoshiAmount,
      qrCode,
      paymentUrl,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('New address error:', error);
    res.status(500).json({ error: 'Failed to generate Bitcoin address' });
  }
});

// GET /api/blockonomics/callback
router.get('/callback', async (req, res) => {
  try {
    const { secret, addr, status, value, txid } = req.query;

    // Verify callback secret
    if (secret !== process.env.BLOCKONOMICS_CALLBACK_SECRET) {
      return res.status(401).json({ error: 'Invalid callback secret' });
    }

    // Find transaction by address
    const transaction = await BlockonomicsTransaction.findOne({ address: addr });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction status
    transaction.status = parseInt(status);
    transaction.value = parseInt(value);
    transaction.txid = txid;
    transaction.timestamp = new Date();
    await transaction.save();

    // Award Runegold when transaction is confirmed (status >= 1)
    if (parseInt(status) >= 1 && !transaction.processed) {
      const user = await User.findById(transaction.userId);
      
      // Check if received amount is at least 90% of expected (allow for small variations)
      const expectedAmount = transaction.amount;
      const receivedAmount = parseInt(value);
      
      if (receivedAmount >= expectedAmount * 0.9) {
        await user.updateRunegoldBalance(
          transaction.runegoldAmount,
          'purchase',
          `Purchased ${transaction.runegoldAmount} Runegold via Bitcoin`
        );

        // Send notification
        await user.addNotification({
          type: 'runegold',
          message: `You received ${transaction.runegoldAmount} Runegold from your Bitcoin payment!`
        });

        transaction.processed = true;
        await transaction.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Failed to process callback' });
  }
});

// GET /api/blockonomics/check-payment/:address
router.get('/check-payment/:address', authenticateToken, async (req, res) => {
  try {
    const { address } = req.params;

    // Check transaction status in database
    const transaction = await BlockonomicsTransaction.findOne({ 
      address,
      userId: req.user.userId 
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Also check with Blockonomics API for latest status
    try {
      const response = await axios.get(
        `https://www.blockonomics.co/api/searchhistory?addr=${address}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.BLOCKONOMICS_API_KEY}`
          }
        }
      );

      const history = response.data.history;
      if (history && history.length > 0) {
        const latestTx = history[0];
        
        // Update local record if needed
        if (latestTx.txid !== transaction.txid || latestTx.status !== transaction.status) {
          transaction.txid = latestTx.txid;
          transaction.status = latestTx.status;
          transaction.value = latestTx.value;
          await transaction.save();
        }
      }
    } catch (apiError) {
      console.error('Blockonomics API error:', apiError);
    }

    res.json({
      status: transaction.status,
      statusText: getStatusText(transaction.status),
      txid: transaction.txid,
      confirmations: getConfirmations(transaction.status),
      value: transaction.value,
      expectedValue: transaction.amount
    });
  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// GET /api/blockonomics/exchange-rate
router.get('/exchange-rate', async (req, res) => {
  try {
    const btcPrice = await getBTCtoUSD();
    
    res.json({
      btcToUsd: btcPrice,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Exchange rate error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

// GET /api/blockonomics/transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const transactions = await BlockonomicsTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(transactions.map(tx => ({
      address: tx.address,
      amount: tx.amount,
      runegoldAmount: tx.runegoldAmount,
      status: tx.status,
      statusText: getStatusText(tx.status),
      txid: tx.txid,
      timestamp: tx.timestamp,
      createdAt: tx.createdAt
    })));
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Helper functions
function getStatusText(status) {
  switch (status) {
    case -1: return 'Pending Payment';
    case 0: return 'Unconfirmed';
    case 1: return 'Partially Confirmed';
    case 2: return 'Confirmed';
    default: return 'Unknown';
  }
}

function getConfirmations(status) {
  switch (status) {
    case -1: return 0;
    case 0: return 0;
    case 1: return 1;
    case 2: return 2;
    default: return 0;
  }
}

// Webhook endpoint for Blockonomics (alternative to callback)
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const { secret } = req.query;
    const { addr, status, value, txid } = req.body;

    // Verify webhook secret
    if (secret !== process.env.BLOCKONOMICS_CALLBACK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    // Process similar to callback
    const transaction = await BlockonomicsTransaction.findOne({ address: addr });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction
    transaction.status = status;
    transaction.value = value;
    transaction.txid = txid;
    transaction.timestamp = new Date();
    await transaction.save();

    // Award Runegold if confirmed
    if (status >= 1 && !transaction.processed) {
      const user = await User.findById(transaction.userId);
      
      if (value >= transaction.amount * 0.9) {
        await user.updateRunegoldBalance(
          transaction.runegoldAmount,
          'purchase',
          `Purchased ${transaction.runegoldAmount} Runegold via Bitcoin`
        );

        await user.addNotification({
          type: 'runegold',
          message: `You received ${transaction.runegoldAmount} Runegold from your Bitcoin payment!`
        });

        transaction.processed = true;
        await transaction.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router;
