const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const GridFSBucket = require('mongodb').GridFSBucket;
const crypto = require('crypto');
require('dotenv').config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://mlnf.net',
      'https://www.mlnf.net',
      'https://mlnf.netlify.app',
      'http://localhost:8080'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB connection
let gfs;
let bucket;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  const db = mongoose.connection.db;
  bucket = new GridFSBucket(db, {
    bucketName: 'videos'
  });
  console.log('✅ GridFS bucket initialized');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(compression());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://mlnf.net',
      'https://www.mlnf.net', 
      'https://mlnf.netlify.app',
      'http://localhost:8080'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Make bucket available to routes
app.set('bucket', bucket);
app.set('io', io);

// Routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const runegoldRoutes = require('./routes/runegold');
const donationRoutes = require('./routes/donations');
const blockonomicsRoutes = require('./routes/blockonomics');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/runegold', runegoldRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/blockonomics', blockonomicsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Socket.io connection handling
const activeUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (data) => {
    const { userId, username } = data;
    if (userId && username) {
      activeUsers.set(socket.id, { userId, username, socketId: socket.id });
      userSockets.set(userId, socket.id);
      
      // Broadcast updated online users list
      io.emit('onlineUsers', Array.from(activeUsers.values()));
      console.log(`User ${username} authenticated`);
    }
  });

  // Handle private messages
  socket.on('privateMessage', (data) => {
    const { to, from, message, timestamp } = data;
    const recipientSocketId = userSockets.get(to);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('privateMessage', {
        from,
        message,
        timestamp: timestamp || new Date()
      });
    }
    
    // Send confirmation back to sender
    socket.emit('messageDelivered', { to, timestamp });
  });

  // Handle video comments in real-time
  socket.on('newComment', (data) => {
    io.emit('commentAdded', data);
  });

  // Handle video votes in real-time
  socket.on('videoVote', (data) => {
    io.emit('voteUpdate', data);
  });

  // Handle Runegold transactions
  socket.on('runegoldTransaction', (data) => {
    const { userId, type, amount, newBalance } = data;
    const userSocketId = userSockets.get(userId);
    
    if (userSocketId) {
      io.to(userSocketId).emit('runegoldUpdate', {
        type,
        amount,
        newBalance,
        timestamp: new Date()
      });
    }
  });

  // Handle notifications
  socket.on('sendNotification', (data) => {
    const { userId, notification } = data;
    const userSocketId = userSockets.get(userId);
    
    if (userSocketId) {
      io.to(userSocketId).emit('notification', notification);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      userSockets.delete(user.userId);
      io.emit('onlineUsers', Array.from(activeUsers.values()));
      console.log(`User ${user.username} disconnected`);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { to, from, isTyping } = data;
    const recipientSocketId = userSockets.get(to);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typingStatus', {
        from,
        isTyping
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is ${process.env.MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
    🚀 MLNF Server Running
    📍 Port: ${PORT}
    🌍 Environment: ${process.env.NODE_ENV}
    🔗 Client URL: ${process.env.CLIENT_URL}
    ⚡ Socket.io: Enabled
    🛡️  CORS: Configured
    📊 Rate Limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS} req/${process.env.RATE_LIMIT_WINDOW_MS}ms
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, io, bucket };