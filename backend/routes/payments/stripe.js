const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../../middleware/auth');

router.post('/create-checkout', auth, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe payments disabled' });
    }

    const { pack } = req.body;
    // Implementation for Stripe checkout
    res.json({ message: 'Stripe checkout session created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

module.exports = router;