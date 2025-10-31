const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');

router.post('/create-invoice', auth, async (req, res) => {
  if (!process.env.BLOCKONOMICS_API_KEY) {
    return res.status(503).json({ error: 'Bitcoin payments disabled' });
  }
  res.json({ message: 'Bitcoin invoice created' });
});

module.exports = router;