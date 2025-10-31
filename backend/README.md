# MLNF Backend API

Backend server for Much Love, No Fear video platform with MongoDB database.

## Features

- RESTful API for videos, users, blog, news, and forum
- MongoDB with Mongoose ODM
- GridFS for video storage
- JWT authentication
- Socket.io for real-time features
- Runegold virtual economy
- Payment integration (Stripe, PayPal, Crypto)

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Runegold Economy
BOOST_COST=10
EXCLUSIVE_CONTENT_PRICE=50

# Payment APIs (Optional)
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret

# Ethereum (Optional)
ETHEREUM_RPC_URL=your_ethereum_rpc
CONTRACT_ADDRESS=your_smart_contract_address
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start MongoDB (if running locally)
mongod

# Run the seed script to populate sample data
npm run seed

# Start development server
npm run dev
```

The server will run on `http://localhost:5000`

### Seeding the Database

The seed script populates your database with sample content:

```bash
npm run seed
```

This creates:
- **3 blog posts** covering topics like awakening, health, and decentralization
- **3 news articles** with breaking news and trending topics
- **3 forum topics** with discussions and replies
- **1 admin user** (username: `mlnf_admin`, password: `admin123`)

## Deployment to Render

### Step 1: Prepare Your Repository

Ensure all backend code is pushed to GitHub:

```bash
git add backend/
git commit -m "feat: Add backend API with seed data"
git push origin main
```

### Step 2: Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Render access
5. Copy your connection string

### Step 3: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** `much-love-no-fear`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate a random secure string
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (Render will override this automatically)

6. Click "Create Web Service"

### Step 4: Seed Production Database

Once deployed, you need to seed your production database. You have two options:

#### Option A: Use Render Shell

1. Go to your Render service dashboard
2. Click "Shell" tab
3. Run: `npm run seed`

#### Option B: Temporary Local Connection

1. Update `.env` with production `MONGODB_URI`
2. Run: `npm run seed` locally
3. Revert `.env` back to local settings

### Step 5: Verify Deployment

Your backend API will be available at: `https://much-love-no-fear.onrender.com`

Test endpoints:
- `GET /api/health` - Health check
- `GET /api/blog` - List blog posts
- `GET /api/news` - List news articles
- `GET /api/forum` - List forum topics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Videos
- `GET /api/videos` - List all videos
- `GET /api/videos/:id` - Get single video
- `POST /api/videos` - Upload video (requires auth)
- `GET /api/videos/:id/stream` - Stream video

### Blog
- `GET /api/blog` - List blog posts
- `GET /api/blog/:id` - Get single post
- `POST /api/blog` - Create post (requires auth)
- `POST /api/blog/:id/comment` - Add comment (requires auth)

### News
- `GET /api/news` - List news articles
- `GET /api/news/:id` - Get single article
- `POST /api/news` - Create article (admin only)

### Forum
- `GET /api/forum` - List forum topics
- `GET /api/forum/:id` - Get single topic with replies
- `POST /api/forum` - Create topic (requires auth)
- `POST /api/forum/:id/reply` - Add reply (requires auth)

### Runegold
- `GET /api/runegold/balance` - Get user balance (requires auth)
- `POST /api/runegold/earn/:action` - Earn Runegold (requires auth)
- `POST /api/runegold/spend/boost/:videoId` - Boost video (requires auth)

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.io
- **Authentication:** JWT with bcrypt
- **Payments:** Stripe, PayPal, Ethers.js
- **Security:** Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── models/           # Mongoose schemas
│   ├── User.js
│   ├── Video.js
│   ├── BlogPost.js
│   ├── NewsArticle.js
│   └── ForumTopic.js
├── routes/           # API routes
│   ├── auth.js
│   ├── videos.js
│   ├── blog.js
│   ├── news.js
│   ├── forum.js
│   └── runegold.js
├── middleware/       # Custom middleware (coming soon)
├── utils/           # Helper functions (coming soon)
├── server.js        # Main application file
├── seed-data.js     # Database seeding script
├── package.json     # Dependencies and scripts
└── .env.example     # Environment variables template
```

## Development Notes

### Adding New Features

1. Create model in `models/` if needed
2. Create routes in `routes/`
3. Update `server.js` to include new routes
4. Update seed data if applicable
5. Test locally before deploying

### Database Migrations

This project doesn't use formal migrations. Schema changes are handled by:
1. Updating the Mongoose model
2. Mongoose will automatically adapt on next server start
3. For breaking changes, create a migration script similar to `seed-data.js`

### Testing API Locally

Use tools like Postman, Insomnia, or curl:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test blog endpoint
curl http://localhost:5000/api/blog

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### "Backend Not Connected" message on frontend

1. Ensure backend is deployed and running on Render
2. Check Render logs for errors
3. Verify MONGODB_URI is correct
4. Run seed script to populate data
5. Check CORS settings allow frontend domain

### MongoDB Connection Errors

1. Verify connection string format
2. Ensure IP whitelist includes 0.0.0.0/0
3. Check database user permissions
4. Confirm database name in connection string

### Videos Not Uploading

1. Check GridFS configuration
2. Verify file size limits (default 100MB)
3. Check disk space on server
4. Review Render logs for memory issues

## Support

For issues or questions:
- Open an issue on GitHub
- Check deployment logs on Render
- Review MongoDB Atlas logs
- Join the MLNF community forum

## License

MIT License - See LICENSE file for details
