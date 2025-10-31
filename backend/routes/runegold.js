const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RunegoldPool = require('../models/RunegoldPool');
const { auth } = require('../middleware/auth');

// Get Runegold balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('runegold');
    res.json({ balance: user.runegold.balance, journey: user.runegold.journey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Get pricing
router.get('/pricing', async (req, res) => {
  try {
    const pool = await RunegoldPool.getCurrent();
    res.json({ pricing: pool.pricing, spending: pool.spending });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

// Tip user
router.post('/tip', auth, async (req, res) => {
  try {
    const { recipientId, amount } = req.body;

    if (amount < 10 || amount > 100) {
      return res.status(400).json({ error: 'Tip amount must be between 10 and 100 Runegold' });
    }

    const sender = await User.findById(req.userId);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (sender.runegold.balance < amount) {
      return res.status(400).json({ error: 'Insufficient Runegold balance' });
    }

    await sender.updateRunegoldBalance(amount, 'spend', `Tipped ${recipient.username}`);
    await recipient.updateRunegoldBalance(amount, 'earn', `Tip from ${sender.username}`);

    const pool = await RunegoldPool.getCurrent();
    await pool.addTransaction('tip', req.userId, amount, 'User tip');

    res.json({ message: 'Tip sent successfully', newBalance: sender.runegold.balance - amount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send tip' });
  }
});

module.exports = router;