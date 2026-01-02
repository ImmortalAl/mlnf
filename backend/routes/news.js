const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const NewsArticle = require('../models/NewsArticle');
const { authMiddleware } = require('./auth');

// Optional auth middleware - doesn't require auth but adds user if present
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) req.user = user;
    }
  } catch (error) {
    // Token invalid - continue without user
  }
  next();
};

// Get all news articles (admins see all, others see only published)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      breaking,
      trending,
      includeHidden,
      page = 1,
      limit = 20
    } = req.query;

    // Admins can see hidden articles if requested
    const isAdmin = req.user && req.user.role === 'admin';
    const query = {};

    // Only filter by published if not admin or admin didn't request hidden
    if (!isAdmin || includeHidden !== 'true') {
      query.published = true;
    }

    if (category) query.category = category;
    if (breaking === 'true') query.breaking = true;
    if (trending === 'true') query.trending = true;

    const articles = await NewsArticle.find(query)
      .populate('author', 'username')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await NewsArticle.countDocuments(query);

    res.json({
      articles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      },
      isAdmin // Let frontend know if user is admin
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Failed to get news articles' });
  }
});

// Get single news article
router.get('/:id', async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Increment views
    await article.incrementViews();
    
    res.json({ article });
  } catch (error) {
    console.error('Get news article error:', error);
    res.status(500).json({ error: 'Failed to get news article' });
  }
});

// Create news article (authenticated users - all posts auto-published, admins can delete later)
router.post('/', authMiddleware, [
  body('title').notEmpty().isLength({ max: 200 }),
  body('excerpt').notEmpty().isLength({ max: 500 }),
  body('content').notEmpty(),
  body('category').optional().isIn(['Breaking', 'Health', 'Politics', 'Economics', 'Technology', 'World', 'General'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, excerpt, content, category, source, sourceUrl, featuredImage, breaking, trending } = req.body;

    // Only admins can set breaking/trending status
    const isAdmin = req.user.role === 'admin';

    const article = new NewsArticle({
      title,
      excerpt,
      content,
      category,
      source,
      sourceUrl,
      featuredImage,
      author: req.user._id, // Track who posted
      breaking: isAdmin ? breaking : false,
      trending: isAdmin ? trending : false,
      published: true // All posts are auto-published - admins can delete unwanted content
    });

    await article.save();

    res.status(201).json({
      message: 'News article published successfully',
      article,
      requiresApproval: false
    });
  } catch (error) {
    console.error('Create news article error:', error);
    res.status(500).json({ error: 'Failed to create news article' });
  }
});

// Update news article (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Only admins can update articles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update news articles' });
    }

    const article = await NewsArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const { title, excerpt, content, category, source, sourceUrl, featuredImage, breaking, trending, published } = req.body;

    if (title) article.title = title;
    if (excerpt) article.excerpt = excerpt;
    if (content) article.content = content;
    if (category) article.category = category;
    if (source !== undefined) article.source = source;
    if (sourceUrl !== undefined) article.sourceUrl = sourceUrl;
    if (featuredImage !== undefined) article.featuredImage = featuredImage;
    if (breaking !== undefined) article.breaking = breaking;
    if (trending !== undefined) article.trending = trending;
    if (published !== undefined) article.published = published;

    await article.save();

    res.json({
      message: 'News article updated successfully',
      article
    });
  } catch (error) {
    console.error('Update news article error:', error);
    res.status(500).json({ error: 'Failed to update news article' });
  }
});

// Delete news article (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Only admins can delete articles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete news articles' });
    }

    const article = await NewsArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await article.deleteOne();

    res.json({
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Delete news article error:', error);
    res.status(500).json({ error: 'Failed to delete news article' });
  }
});

// Toggle article visibility (admin only) - hide without deleting
router.post('/:id/toggle-visibility', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can toggle article visibility' });
    }

    const article = await NewsArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    article.published = !article.published;
    await article.save();

    res.json({
      message: `Article ${article.published ? 'published' : 'hidden'} successfully`,
      published: article.published
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Failed to toggle article visibility' });
  }
});

module.exports = router;
