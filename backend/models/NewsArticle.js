const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    enum: ['Breaking', 'Health', 'Politics', 'Economics', 'Technology', 'World', 'General'],
    default: 'General'
  },
  source: {
    type: String,
    trim: true
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  featuredImage: {
    type: String
  },
  breaking: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  published: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
newsArticleSchema.index({ published: 1, publishedAt: -1 });
newsArticleSchema.index({ category: 1 });
newsArticleSchema.index({ breaking: 1 });
newsArticleSchema.index({ trending: 1 });

// Methods
newsArticleSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('NewsArticle', newsArticleSchema);
