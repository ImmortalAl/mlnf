const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const NewsArticle = require('../models/NewsArticle');
const { authMiddleware } = require('./auth');

// Get all news articles
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      breaking, 
      trending,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = { published: true };
    
    if (category) query.category = category;
    if (breaking === 'true') query.breaking = true;
    if (trending === 'true') query.trending = true;
    
    const articles = await NewsArticle.find(query)
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
      }
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

// Create news article (authenticated, admin only)
router.post('/', authMiddleware, [
  body('title').notEmpty().isLength({ max: 200 }),
  body('excerpt').notEmpty().isLength({ max: 500 }),
  body('content').notEmpty(),
  body('category').optional().isIn(['Breaking', 'Health', 'Politics', 'Economics', 'Technology', 'World', 'General'])
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, excerpt, content, category, source, sourceUrl, featuredImage, breaking, trending } = req.body;
    
    const article = new NewsArticle({
      title,
      excerpt,
      content,
      category,
      source,
      sourceUrl,
      featuredImage,
      breaking,
      trending
    });
    
    await article.save();
    
    res.status(201).json({
      message: 'News article created successfully',
      article
    });
  } catch (error) {
    console.error('Create news article error:', error);
    res.status(500).json({ error: 'Failed to create news article' });
  }
});

module.exports = router;
