const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const RunegoldPool = require('../models/RunegoldPool');
const User = require('../models/User');
const Video = require('../models/Video');

// Admin middleware
const adminAuth = async (req, res, next) => {
  const { username, password } = req.headers;

  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

router.use(adminAuth);

router.get('/stats', async (req, res) => {
  try {
    const pool = await RunegoldPool.getCurrent();
    const stats = {
      users: await User.countDocuments(),
      videos: await Video.countDocuments({ status: 'active' }),
      runegoldPool: pool.getStatistics()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.post('/runegold/inject', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const pool = await RunegoldPool.getCurrent();
    await pool.addToReserve(amount, description);
    res.json({ message: 'Runegold injected', reserve: pool.reserve });
  } catch (error) {
    res.status(500).json({ error: 'Failed to inject Runegold' });
  }
});

module.exports = router;