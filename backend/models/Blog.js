const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Blog content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  featuredImage: {
    type: String,
    default: 'default-blog-image.jpg'
  },
  category: {
    type: String,
    enum: ['news', 'tutorial', 'announcement', 'community', 'update', 'guide', 'story', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  linkedVideo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isDeleted: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  metadata: {
    readTime: Number, // in minutes
    wordCount: Number,
    lastEditorUsed: {
      type: String,
      default: 'quill'
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
blogSchema.index({ slug: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Generate slug from title
blogSchema.pre('validate', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.generateSlug(this.title);
  }
  next();
});

// Method to generate slug
blogSchema.methods.generateSlug = function(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .substring(0, 100) + '-' + Date.now().toString(36);
};

// Calculate reading time and word count
blogSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Remove HTML tags for word count
    const plainText = this.content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;

    this.metadata = {
      ...this.metadata,
      wordCount,
      readTime: Math.ceil(wordCount / 200) // Average reading speed: 200 words per minute
    };
  }

  // Auto-generate excerpt if not provided
  if (!this.excerpt && this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 300) + '...';
  }

  next();
});

// Method to publish blog
blogSchema.methods.publish = async function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Method to archive blog
blogSchema.methods.archive = async function() {
  this.status = 'archived';
  return this.save();
};

// Method to toggle like
blogSchema.methods.toggleLike = async function(userId) {
  const userIdStr = userId.toString();
  const likeIndex = this.likes.findIndex(id => id.toString() === userIdStr);

  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }

  return this.save();
};

// Method to add comment
blogSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    author: userId,
    content,
    createdAt: new Date()
  });

  return this.save();
};

// Method to delete comment
blogSchema.methods.deleteComment = async function(commentId) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.isDeleted = true;
    return this.save();
  }
  throw new Error('Comment not found');
};

// Method to increment views
blogSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Static method to get featured blogs
blogSchema.statics.getFeatured = function(limit = 5) {
  return this.find({
    status: 'published',
    isFeatured: true
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('author', 'username avatar')
  .populate('linkedVideo', 'title thumbnail');
};

// Static method to get pinned blogs
blogSchema.statics.getPinned = function() {
  return this.find({
    status: 'published',
    isPinned: true
  })
  .sort({ publishedAt: -1 })
  .populate('author', 'username avatar');
};

// Static method to get related blogs
blogSchema.statics.getRelated = function(blogId, tags, limit = 3) {
  return this.find({
    _id: { $ne: blogId },
    status: 'published',
    tags: { $in: tags }
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .select('title slug excerpt featuredImage author publishedAt');
};

// Virtual for like count
blogSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
blogSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.filter(c => !c.isDeleted).length : 0;
});

module.exports = mongoose.model('Blog', blogSchema);