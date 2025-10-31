const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const User = require('../models/User');
const Blog = require('../models/Blog');

router.get('/', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const results = { videos: [], users: [], blogs: [] };

    if (type === 'all' || type === 'videos') {
      results.videos = await Video.find({ $text: { $search: q }, status: 'active' })
        .limit(10)
        .populate('author', 'username avatar');
    }

    if (type === 'all' || type === 'users') {
      results.users = await User.find({ username: new RegExp(q, 'i'), isActive: true })
        .limit(10)
        .select('username avatar bio');
    }

    if (type === 'all' || type === 'blogs') {
      results.blogs = await Blog.find({ $text: { $search: q }, status: 'published' })
        .limit(10)
        .populate('author', 'username avatar');
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;