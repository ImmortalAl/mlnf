const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .populate('author', 'username avatar');
    res.json({ blogs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const blog = await Blog.create({ ...req.body, author: req.userId });
    res.status(201).json({ blog });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

module.exports = router;