const express = require('express');
const router = express.Router();
const News = require('../models/News');

router.get('/', async (req, res) => {
  try {
    const news = await News.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .populate('author', 'username avatar');
    res.json({ news });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.get('/carousel', async (req, res) => {
  try {
    const carousel = await News.getCarousel();
    res.json({ carousel });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch carousel' });
  }
});

module.exports = router;