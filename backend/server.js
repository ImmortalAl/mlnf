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

// Import models
const Message = require('./models/Message');
const User = require('./models/User');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: function(origin, callback) {
      // Allow all origins for Socket.io in development
      if (!origin || process.env.NODE_ENV === 'development') {
        callback(null, true);
        return;
      }
      
      const allowedOrigins = [
        'https://mlnf.net',
        'https://www.mlnf.net',
        'https://mlnf.netlify.app',
        /https:\/\/.*\.sandbox\.novita\.ai$/,
        /https:\/\/.*\.netlify\.app$/,
        /https:\/\/.*\.vercel\.app$/
      ];
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return origin === allowed;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
      
      callback(null, isAllowed);
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB connection
let gfs;
let bucket;

// Sanitize MongoDB URI - remove port number if using mongodb+srv protocol
let mongoUri = process.env.MONGODB_URI;
if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
  // Remove any port number from mongodb+srv URI (not allowed)
  mongoUri = mongoUri.replace(/:(\d+)\//, '/');
  if (mongoUri !== process.env.MONGODB_URI) {
    console.log('⚠️  Removed port number from mongodb+srv URI');
  }
}

mongoose.connect(mongoUri, {
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
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5000',
      // Allow sandbox URLs during development
      /https:\/\/.*\.sandbox\.novita\.ai$/,
      // Allow Netlify preview URLs
      /https:\/\/.*\.netlify\.app$/,
      // Allow Vercel preview URLs
      /https:\/\/.*\.vercel\.app$/
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
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
const blogRoutes = require('./routes/blog');
const newsRoutes = require('./routes/news');
const forumRoutes = require('./routes/forum');
const messageRoutes = require('./routes/messages');
const livestreamRoutes = require('./routes/livestream');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/runegold', runegoldRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/blockonomics', blockonomicsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/livestream', livestreamRoutes);

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
const streamViewers = new Map(); // Track viewers per stream

// Helper to get unique online users (deduplicates multiple tabs/connections)
function getUniqueOnlineUsers() {
  const usersById = new Map();
  activeUsers.forEach(user => {
    // Only keep first occurrence of each userId
    if (!usersById.has(user.userId)) {
      usersById.set(user.userId, user);
    }
  });
  return Array.from(usersById.values());
}

io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (data) => {
    const { userId, username } = data;
    if (userId && username) {
      activeUsers.set(socket.id, { userId, username, socketId: socket.id });
      userSockets.set(userId, socket.id);

      // Broadcast updated online users list (deduplicated)
      io.emit('onlineUsers', getUniqueOnlineUsers());
      console.log(`User ${username} authenticated`);
    }
  });

  // Handle private messages
  socket.on('privateMessage', async (data) => {
    try {
      const { to, from, message, timestamp } = data;
      
      // Get user information
      const sender = await User.findById(from);
      const recipient = await User.findById(to);
      
      if (!sender || !recipient) {
        console.error('Invalid sender or recipient');
        socket.emit('messageError', { error: 'Invalid user' });
        return;
      }
      
      // Save message to database
      const newMessage = new Message({
        sender: from,
        senderUsername: sender.username,
        recipient: to,
        recipientUsername: recipient.username,
        message: message,
        delivered: false
      });
      
      await newMessage.save();
      
      // Send to recipient via socket if online
      const recipientSocketId = userSockets.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('privateMessage', {
          messageId: newMessage._id,
          from,
          fromUsername: sender.username,
          message,
          timestamp: newMessage.createdAt
        });
        
        // Mark as delivered
        newMessage.delivered = true;
        await newMessage.save();
      }
      
      // Send confirmation back to sender
      socket.emit('messageDelivered', { 
        messageId: newMessage._id,
        to, 
        timestamp: newMessage.createdAt 
      });
    } catch (error) {
      console.error('Error handling private message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
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
      // Only remove from userSockets if no other connections exist for this user
      const userStillConnected = Array.from(activeUsers.values()).some(u => u.userId === user.userId);
      if (!userStillConnected) {
        userSockets.delete(user.userId);
      }
      io.emit('onlineUsers', getUniqueOnlineUsers());
      console.log(`User ${user.username} disconnected (socket: ${socket.id})`);
    }

    // Remove socket from all stream viewer counts
    streamViewers.forEach((viewers, streamId) => {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);

        // Emit updated warrior count
        const count = viewers.size;
        io.to(`stream-${streamId}`).emit('warrior-count', count);

        // Clean up empty stream viewer sets
        if (count === 0) {
          streamViewers.delete(streamId);
        }
      }
    });
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

  // Livestream: Join stream room
  socket.on('join-stream', (streamId) => {
    console.log(`Socket ${socket.id} joined stream ${streamId}`);
    socket.join(`stream-${streamId}`);

    // Track this socket as viewer of this stream
    if (!streamViewers.has(streamId)) {
      streamViewers.set(streamId, new Set());
    }
    streamViewers.get(streamId).add(socket.id);

    // Emit updated warrior count to all viewers in stream
    const count = streamViewers.get(streamId).size;
    io.to(`stream-${streamId}`).emit('warrior-count', count);
    console.log(`Stream ${streamId} now has ${count} warriors watching`);
  });

  // Livestream: Leave stream room
  socket.on('leave-stream', (streamId) => {
    console.log(`Socket ${socket.id} left stream ${streamId}`);
    socket.leave(`stream-${streamId}`);

    // Remove this socket from stream viewers
    if (streamViewers.has(streamId)) {
      streamViewers.get(streamId).delete(socket.id);

      // Emit updated warrior count
      const count = streamViewers.get(streamId).size;
      io.to(`stream-${streamId}`).emit('warrior-count', count);

      // Clean up empty stream viewer sets
      if (count === 0) {
        streamViewers.delete(streamId);
      }
    }
  });

  // Livestream: Chat message in stream
  socket.on('chat-message', async (data) => {
    try {
      const { streamId, userId, username, text } = data;
      const timestamp = new Date();

      // Save message to database
      const Livestream = require('./models/Livestream');
      await Livestream.findByIdAndUpdate(streamId, {
        $push: {
          chatHistory: {
            userId,
            username,
            text,
            timestamp
          }
        }
      });

      // Broadcast message to all viewers in this stream
      io.to(`stream-${streamId}`).emit('new-message', {
        streamId,
        userId,
        username,
        text,
        timestamp
      });

      console.log(`Chat message in stream ${streamId} from ${username}: ${text}`);
    } catch (error) {
      console.error('Chat message error:', error);
    }
  });

  // Livestream: Get warrior count for specific stream
  socket.on('get-warrior-count', (streamId) => {
    const count = streamViewers.has(streamId) ? streamViewers.get(streamId).size : 0;
    socket.emit('warrior-count', count);
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
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, io, bucket };