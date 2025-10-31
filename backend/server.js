require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Grid = require('gridfs-stream');

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:8080',
      'https://mlnf.net',
      'https://www.mlnf.net',
      'https://mlnf.netlify.app',
      'http://localhost:3000',
      'http://localhost:5000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');

  // Initialize GridFS
  const conn = mongoose.connection;
  conn.once('open', () => {
    // Initialize GridFS
    Grid.mongo = mongoose.mongo;
    const gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    app.locals.gfs = gfs;

    // Initialize Runegold Pool
    initializeRunegoldPool();
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Initialize Runegold Pool
async function initializeRunegoldPool() {
  try {
    const RunegoldPool = require('./models/RunegoldPool');
    const pool = await RunegoldPool.findOne();
    if (!pool) {
      await RunegoldPool.create({
        reserve: process.env.RUNEGOLD_INITIAL_RESERVE || 0
      });
      console.log('Runegold Pool initialized');
    }
  } catch (error) {
    console.error('Error initializing Runegold Pool:', error);
  }
}

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.socket.io", "https://js.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.paypal.com"]
    }
  }
}));

// Compression
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5000',
      'https://mlnf.net',
      'https://www.mlnf.net',
      'https://mlnf.netlify.app',
      'https://much-love-no-fear.onrender.com'
    ];

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
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

// Socket.io middleware and handlers
require('./utils/socketHandlers')(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/runegold', require('./routes/runegold'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/news', require('./routes/news'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));

// Payment routes (conditional)
if (process.env.STRIPE_SECRET_KEY) {
  app.use('/api/payments/stripe', require('./routes/payments/stripe'));
}
if (process.env.PAYPAL_CLIENT_ID) {
  app.use('/api/payments/paypal', require('./routes/payments/paypal'));
}
if (process.env.BLOCKONOMICS_API_KEY) {
  app.use('/api/payments/bitcoin', require('./routes/payments/bitcoin'));
}
if (process.env.ETH_WALLET_ADDRESS) {
  app.use('/api/payments/ethereum', require('./routes/payments/ethereum'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server startup
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     Much Love, No Fear - Server          ║
║                                           ║
║     Environment: ${process.env.NODE_ENV.padEnd(25)}║
║     Port: ${PORT.toString().padEnd(32)}║
║     MongoDB: Connected                   ║
║     Socket.io: Active                     ║
╚═══════════════════════════════════════════╝
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

module.exports = { app, io };