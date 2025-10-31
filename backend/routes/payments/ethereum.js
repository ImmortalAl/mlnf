const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');

router.get('/wallet-address', async (req, res) => {
  if (!process.env.ETH_WALLET_ADDRESS) {
    return res.status(503).json({ error: 'Ethereum payments disabled' });
  }
  res.json({ address: process.env.ETH_WALLET_ADDRESS });
});

module.exports = router;