const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');

router.post('/create-order', auth, async (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID) {
    return res.status(503).json({ error: 'PayPal payments disabled' });
  }
  res.json({ message: 'PayPal order created' });
});

module.exports = router;