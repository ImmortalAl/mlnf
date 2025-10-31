require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== MongoDB Configuration Check ===');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('Connection string format:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'MISSING');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT);
console.log('');
console.log('Attempting MongoDB connection test...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connection SUCCESSFUL');
  process.exit(0);
})
.catch(err => {
  console.log('❌ MongoDB connection FAILED');
  console.log('Error name:', err.name);
  console.log('Error message:', err.message);
  console.log('');
  
  if (err.message.includes('ECONNREFUSED')) {
    console.log('Issue: Connection refused - cluster may be down');
  } else if (err.message.includes('timed out')) {
    console.log('Issue: Connection timeout - likely IP whitelist or network issue');
    console.log('');
    console.log('SOLUTION REQUIRED:');
    console.log('1. Go to MongoDB Atlas dashboard');
    console.log('2. Navigate to Network Access');
    console.log('3. Add IP Address: 0.0.0.0/0 (allow all for development)');
  } else if (err.message.includes('authentication failed')) {
    console.log('Issue: Username or password incorrect');
  }
  
  process.exit(1);
});

setTimeout(() => {
  console.log('Test timed out after 15 seconds');
  process.exit(1);
}, 15000);
