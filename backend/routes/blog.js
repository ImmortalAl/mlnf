const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BlogPost = require('../models/BlogPost');
const { authMiddleware } = require('./auth');

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      featured, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = { published: true };
    
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    
    const posts = await BlogPost.find(query)
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content'); // Don't send full content in list
    
    const total = await BlogPost.countDocuments(query);
    
    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Failed to get blog posts' });
  }
});

// Get single blog post
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'username profilePicture bio')
      .populate('comments.user', 'username profilePicture');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Increment views
    await post.incrementViews();
    
    res.json({ post });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ error: 'Failed to get blog post' });
  }
});

// Create blog post (authenticated)
router.post('/', authMiddleware, [
  body('title').notEmpty().isLength({ max: 200 }),
  body('content').notEmpty(),
  body('excerpt').optional().isLength({ max: 500 }),
  body('category').optional().isIn(['Freedom', 'Health', 'Finance', 'Spirituality', 'Technology', 'Education', 'General'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, excerpt, category, tags, featuredImage } = req.body;
    
    // Generate slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const post = new BlogPost({
      title,
      slug: `${slug}-${Date.now()}`,
      content,
      excerpt,
      category,
      tags: tags || [],
      featuredImage,
      author: req.user._id,
      published: true
    });
    
    await post.save();
    
    res.status(201).json({
      message: 'Blog post created successfully',
      post
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Add comment to blog post
router.post('/:id/comment', authMiddleware, [
  body('content').notEmpty().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      content: req.body.content
    });

    await post.save();

    res.status(201).json({
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update blog post (authenticated, owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this post' });
    }

    const { title, content, excerpt, category, tags, featuredImage, published } = req.body;

    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (category) post.category = category;
    if (tags) post.tags = tags;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (published !== undefined) post.published = published;

    await post.save();

    res.json({
      message: 'Blog post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post (authenticated, owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await post.deleteOne();

    res.json({
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Like/unlike blog post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      liked: likeIndex === -1,
      likes: post.likes.length
    });
  } catch (error) {
    console.error('Like blog post error:', error);
    res.status(500).json({ error: 'Failed to like blog post' });
  }
});

// Add comment (alternative endpoint for blog-post.html)
router.post('/:id/comments', authMiddleware, [
  body('content').notEmpty().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      content: req.body.content,
      createdAt: new Date()
    });

    await post.save();

    res.status(201).json({
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
