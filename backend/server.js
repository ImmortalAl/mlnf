require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const runegoldRoutes = require('./routes/runegold');
const donationRoutes = require('./routes/donations');
const blocknomicsRoutes = require('./routes/blockonomics');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Trust proxy (for Render deployment)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/runegold', runegoldRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/blockonomics', blocknomicsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    
    // Broadcast updated online users list
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // Handle P2P messaging
  socket.on('privateMessage', ({ to, message, timestamp }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('privateMessage', {
        from: socket.userId,
        message,
        timestamp
      });
    }
  });

  // Handle video interactions in real-time
  socket.on('videoVote', ({ videoId, voteType, userId }) => {
    // Broadcast vote update to all clients
    io.emit('voteUpdate', { videoId, voteType, userId });
  });

  socket.on('videoComment', ({ videoId, comment, userId }) => {
    // Broadcast new comment to all clients
    io.emit('newComment', { videoId, comment, userId });
  });

  // Handle notifications
  socket.on('sendNotification', ({ to, notification }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('notification', notification);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'This value already exists in the database'
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication credentials'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Export for testing
module.exports = { app, io };
