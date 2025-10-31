# MLNF Testing Guide

## 🧪 Comprehensive Testing Procedures

This guide provides step-by-step instructions to verify all features of the Much Love, No Fear platform.

## Prerequisites

- Node.js 20+ installed
- MongoDB Atlas connection
- Backend server running on port 5000
- Frontend served on port 8080
- Test accounts created

## 1. Backend API Testing

### 1.1 Health Check
```bash
curl http://localhost:5000/api/health
```
**Expected**: Status 200, JSON with "healthy" status

### 1.2 User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "email": "test@example.com",
    "secretQuestion": "What is your favorite color?",
    "secretAnswer": "blue"
  }'
```
**Expected**: Status 201, user object with token

### 1.3 User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```
**Expected**: Status 200, user object with JWT token

### 1.4 Get User Profile (Authenticated)
```bash
TOKEN="your_jwt_token_here"
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: Status 200, full user profile

## 2. Frontend Testing

### 2.1 Homepage (index.html)
1. Navigate to `http://localhost:8080`
2. Verify Viking-themed design loads
3. Check header with logo "Much Love, No Fear"
4. Verify navigation links (Archive, Blog, News, Donations, Merch)
5. Test mobile responsive menu (< 768px width)
6. Verify footer displays

**Pass Criteria**:
- ✅ Page loads without errors
- ✅ All CSS styles applied
- ✅ Navigation functional
- ✅ Responsive on mobile

### 2.2 Authentication (pages/auth.html)
1. Navigate to auth page
2. Test registration form:
   - Username (3-30 chars)
   - Password (6+ chars)
   - Email (optional)
   - Secret question & answer
3. Submit registration
4. Test login with created credentials
5. Verify JWT token stored in localStorage
6. Test password recovery flow

**Pass Criteria**:
- ✅ Registration creates account
- ✅ Login receives valid token
- ✅ Validation errors display correctly
- ✅ Recovery flow works

### 2.3 Video Upload (pages/archive.html)
1. Login as authenticated user
2. Click "Upload Video" button
3. Drag and drop video file (< 100MB)
4. Fill in:
   - Title (required, max 200 chars)
   - Description (max 5000 chars)
   - Select 1-3 tags (Truths/Rebels/General)
   - Category selection
5. Submit upload
6. Verify video appears in vault
7. Check GridFS storage in MongoDB

**Pass Criteria**:
- ✅ File upload progress shown
- ✅ Video stored in GridFS
- ✅ Video document created in MongoDB
- ✅ Video appears in archive
- ✅ File size validation (100MB max)

### 2.4 Video Playback
1. Click on any video card
2. Verify video player loads
3. Test controls:
   - Play/Pause
   - Speed (0.5x, 1x, 1.5x, 2x)
   - Volume
   - Fullscreen
   - Subtitles (if available)
4. Test seeking/scrubbing
5. Verify view count increments

**Pass Criteria**:
- ✅ Video streams correctly
- ✅ All controls functional
- ✅ Speed changes work
- ✅ View count updates
- ✅ No buffering issues

### 2.5 Voting System
1. On video page, locate vote buttons
2. Click upvote button
3. Verify:
   - Button highlights green
   - Count increases
   - Real-time update via Socket.io
4. Click upvote again (remove vote)
5. Verify count decreases
6. Test downvote
7. Verify cannot vote twice

**Pass Criteria**:
- ✅ Votes save to database
- ✅ UI updates immediately
- ✅ Real-time sync across sessions
- ✅ Net score calculated correctly
- ✅ User limited to one vote per video

### 2.6 Comments
1. On video page, scroll to comments
2. Add new comment (up to 1000 chars)
3. Optional: Add timestamp link
4. Submit comment
5. Verify comment appears
6. Test reply to comment
7. Test emoji support
8. Test comment highlighting (20 Runegold)

**Pass Criteria**:
- ✅ Comments save correctly
- ✅ Timestamps clickable (seek video)
- ✅ Replies nest properly
- ✅ Emojis render
- ✅ Highlighting costs Runegold

## 3. Runegold Economy Testing

### 3.1 Check Balance
1. Login to dashboard
2. View sidebar Runegold display
3. Verify balance shown

### 3.2 Purchase Runegold (Stripe)
1. Navigate to dashboard Runegold shop
2. Select package:
   - Small: 1000 for $10
   - Medium: 5000 for $45
   - Large: 10000 for $85
3. Click "Buy with Stripe"
4. Complete test payment (use Stripe test card: 4242 4242 4242 4242)
5. Verify balance updates
6. Check Rune Journey shows transaction

**Pass Criteria**:
- ✅ Stripe payment intent creates
- ✅ Payment processes
- ✅ Balance credits correctly
- ✅ Transaction logged in journey
- ✅ Real-time balance update via Socket.io

### 3.3 Purchase Runegold (PayPal)
1. Select package
2. Click "Buy with PayPal"
3. Complete PayPal sandbox payment
4. Verify redirect back to site
5. Check balance updated

**Pass Criteria**:
- ✅ PayPal redirect works
- ✅ Payment executes
- ✅ Balance credits
- ✅ Transaction logged

### 3.4 Purchase Runegold (Bitcoin)
1. Select "Pay with Bitcoin"
2. Verify QR code displays
3. Note Bitcoin address
4. Send test BTC (testnet)
5. Wait for confirmation
6. Verify balance updates

**Pass Criteria**:
- ✅ Address generated via Blockonomics
- ✅ QR code displays
- ✅ Payment detected
- ✅ Balance credits after confirmation

### 3.5 Purchase Runegold (Ethereum)
1. Connect MetaMask wallet
2. Select package
3. Confirm transaction in MetaMask
4. Wait for confirmation
5. Verify balance updates

**Pass Criteria**:
- ✅ MetaMask detects correctly
- ✅ Transaction submits
- ✅ Balance credits after confirmation

### 3.6 Boost Video (50 Runegold)
1. Ensure balance >= 50
2. On video page, click "Boost Video"
3. Confirm payment
4. Verify:
   - Balance deducts 50
   - Video shows "BOOSTED" badge
   - Video appears in carousel
   - Boost expires after 1 hour

**Pass Criteria**:
- ✅ Runegold deducted
- ✅ Video boosted for 1 hour
- ✅ Appears in featured carousel
- ✅ Badge displays on video card
- ✅ Boost expires correctly

### 3.7 Highlight Comment (20 Runegold)
1. Ensure balance >= 20
2. On comment, click "Highlight"
3. Confirm payment
4. Verify:
   - Balance deducts 20
   - Comment shows gold border
   - Comment background highlighted

**Pass Criteria**:
- ✅ Runegold deducted
- ✅ Comment highlighting applied
- ✅ Persistent across refreshes

### 3.8 Purchase Badge (100 Runegold)
1. Navigate to badge shop
2. Select badge
3. Confirm purchase (100 Runegold)
4. Verify:
   - Balance deducts 100
   - Badge appears on profile
   - Badge shows in comments

**Pass Criteria**:
- ✅ Runegold deducted
- ✅ Badge added to user
- ✅ Badge displays on profile

### 3.9 Tip User (10-100 Runegold)
1. On user profile, click "Tip"
2. Enter amount (10-100)
3. Optional: Add message
4. Submit tip
5. Verify:
   - Your balance decreases
   - Recipient balance increases
   - Both users receive notifications
   - Transaction in both journeys

**Pass Criteria**:
- ✅ Sender balance decreases
- ✅ Recipient balance increases
- ✅ Notifications sent
- ✅ Transactions logged

### 3.10 Admin Runegold Injection
1. Login as admin
2. Navigate to `/api/admin/inject-runegold`
3. Send POST request:
```bash
curl -X POST http://localhost:5000/api/runegold/admin/inject-runegold \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id_here",
    "amount": 5000,
    "reason": "Contest winner"
  }'
```
4. Verify user receives Runegold

**Pass Criteria**:
- ✅ Admin can inject Runegold
- ✅ User balance updates
- ✅ Notification sent
- ✅ Transaction logged

## 4. Real-Time Features (Socket.io)

### 4.1 Online Users Sidebar
1. Login on two different browsers/devices
2. Verify both appear in online users list
3. Click on user avatar
4. Verify messaging modal opens
5. Logout on one device
6. Verify user removed from list

**Pass Criteria**:
- ✅ Users appear when online
- ✅ Users removed when offline
- ✅ Avatar displays correctly
- ✅ Online status indicator shows

### 4.2 P2P Messaging
1. Open messaging modal with online user
2. Type message
3. Verify typing indicator shows for recipient
4. Send message
5. Verify:
   - Message appears for sender
   - Message appears for recipient
   - Emoji support works
   - Message timestamps correct

**Pass Criteria**:
- ✅ Messages send/receive in real-time
- ✅ Typing indicators work
- ✅ Emojis render correctly
- ✅ Message history persists

### 4.3 Real-Time Notifications
1. Have User A upvote User B's video
2. Verify User B receives notification
3. Click notification bell
4. Verify notification appears
5. Test notification sound toggle
6. Mark notification as read

**Pass Criteria**:
- ✅ Notifications appear in real-time
- ✅ Bell badge shows count
- ✅ Sound plays (if enabled)
- ✅ Marking as read works
- ✅ Notifications persist

### 4.4 Real-Time Vote Updates
1. Open same video on two browsers
2. Vote on Browser A
3. Verify vote count updates on Browser B
4. No page refresh needed

**Pass Criteria**:
- ✅ Votes sync across clients
- ✅ Count updates without refresh
- ✅ UI reflects current state

### 4.5 Real-Time Comment Updates
1. Open same video on two browsers
2. Add comment on Browser A
3. Verify comment appears on Browser B
4. No page refresh needed

**Pass Criteria**:
- ✅ Comments sync across clients
- ✅ New comments appear immediately
- ✅ Proper formatting maintained

## 5. Donations Testing

### 5.1 Stripe Donation
1. Navigate to donations page
2. Enter amount ($1 minimum)
3. Optional: Enter name, email, message
4. Complete Stripe payment
5. Verify success message

**Pass Criteria**:
- ✅ Payment processes
- ✅ Donation logged
- ✅ Success confirmation shown

### 5.2 PayPal Donation
1. Click "Donate with PayPal"
2. Complete PayPal flow
3. Redirect back to site
4. Verify success

**Pass Criteria**:
- ✅ PayPal redirect works
- ✅ Donation processes
- ✅ Success message displays

### 5.3 Bitcoin Donation
1. Click "Donate Bitcoin"
2. Scan QR code or copy address
3. Send BTC
4. Wait for confirmation
5. Verify donation logged

**Pass Criteria**:
- ✅ Address generates
- ✅ QR code displays
- ✅ Payment detected

### 5.4 Ethereum Donation
1. Connect MetaMask
2. Enter amount
3. Send ETH
4. Verify confirmation

**Pass Criteria**:
- ✅ MetaMask connection works
- ✅ Transaction sends
- ✅ Donation confirmed

## 6. Additional Features

### 6.1 Search Functionality
1. Use search bar in header
2. Search for:
   - Video titles
   - Tags
   - Usernames
3. Verify results display
4. Test filters (tag, date, Runegold)

**Pass Criteria**:
- ✅ Search returns relevant results
- ✅ Filters work correctly
- ✅ Results paginated

### 6.2 Breadcrumbs (Rune-Path Tracker)
1. Navigate through multiple pages
2. Verify breadcrumbs update
3. Click previous breadcrumb
4. Verify navigation back
5. Test "Clear" button
6. Verify breadcrumbs stored in sessionStorage

**Pass Criteria**:
- ✅ Breadcrumbs track navigation
- ✅ Limited to 5 steps
- ✅ Clicking navigates correctly
- ✅ Clear removes all
- ✅ Persists in session

### 6.3 Theme Toggle (Light/Dark)
1. Click theme toggle button
2. Verify theme switches
3. Check preference saved in localStorage
4. Refresh page
5. Verify theme persists

**Pass Criteria**:
- ✅ Theme toggles correctly
- ✅ All colors adapt
- ✅ Preference persists

### 6.4 Message Board
1. Navigate to message board
2. Create new thread
3. Add replies
4. Test search within board
5. Verify threading works

**Pass Criteria**:
- ✅ Threads create
- ✅ Replies nest correctly
- ✅ Search works
- ✅ Video links functional

### 6.5 Blog
1. Navigate to blog
2. Create new post (Quill.js editor)
3. Test formatting:
   - Bold, italic, underline
   - Headers
   - Lists
   - Links
   - Images
4. Publish post
5. View published post

**Pass Criteria**:
- ✅ Quill editor loads
- ✅ Formatting saves
- ✅ Posts publish
- ✅ Posts display correctly

### 6.6 News Carousel
1. Navigate to news page
2. Verify carousel displays
3. Test navigation (prev/next)
4. Test autoplay
5. Vote on "Best Video" of month

**Pass Criteria**:
- ✅ Carousel functional
- ✅ Navigation works
- ✅ Autoplay toggles
- ✅ Voting works

### 6.7 Profile Pages
1. Navigate to your profile
2. Verify displays:
   - Bio
   - Uploaded videos
   - Runegold balance
   - Badges
   - Followers/Following
3. Edit profile
4. Update bio and avatar
5. Save changes

**Pass Criteria**:
- ✅ Profile displays correctly
- ✅ Videos list shown
- ✅ Edit saves changes
- ✅ Avatar uploads

### 6.8 Follow System
1. Visit another user's profile
2. Click "Follow" button
3. Verify:
   - Button changes to "Unfollow"
   - Count increases
   - User receives notification
4. Click "Unfollow"
5. Verify count decreases

**Pass Criteria**:
- ✅ Follow/unfollow works
- ✅ Counts update
- ✅ Notifications sent
- ✅ Reflects in database

## 7. Security Testing

### 7.1 Authentication
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens have 7-day expiry
- ✅ Protected routes require authentication
- ✅ Invalid tokens rejected

### 7.2 Rate Limiting
- ✅ 100 requests per minute enforced
- ✅ Exceeding limit returns 429 error

### 7.3 Input Validation
- ✅ XSS protection (HTML escaped)
- ✅ SQL injection prevented (Mongoose)
- ✅ File upload size limited (100MB)
- ✅ File type validation (videos only)

### 7.4 CORS
- ✅ Only allowed origins accepted
- ✅ Credentials properly handled

## 8. Performance Testing

### 8.1 Page Load Times
- ✅ Homepage loads < 2 seconds
- ✅ Video page loads < 3 seconds
- ✅ CSS/JS files minified in production

### 8.2 Video Streaming
- ✅ HLS streaming works
- ✅ Adaptive bitrate (if implemented)
- ✅ No buffering on good connection

### 8.3 Database Queries
- ✅ Indexes on frequently queried fields
- ✅ Pagination implemented
- ✅ No N+1 query issues

## 9. Mobile Testing

### 9.1 Responsive Design
- ✅ Layout adapts to mobile (< 768px)
- ✅ Touch-friendly buttons (44x44px min)
- ✅ Sidebar collapses on mobile
- ✅ Video player fullscreen works

### 9.2 Mobile Navigation
- ✅ Hamburger menu toggles
- ✅ Navigation accessible
- ✅ Forms usable on mobile

## 10. Browser Compatibility

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Test Summary Checklist

### Critical Features
- [ ] User registration/login
- [ ] Video upload
- [ ] Video playback
- [ ] Voting system
- [ ] Comments
- [ ] Runegold purchases
- [ ] Runegold spending
- [ ] Real-time messaging
- [ ] Notifications
- [ ] Search

### Secondary Features
- [ ] Profile management
- [ ] Follow system
- [ ] Message board
- [ ] Blog
- [ ] Donations
- [ ] Theme toggle
- [ ] Breadcrumbs

### Admin Features
- [ ] Runegold injection
- [ ] Content moderation
- [ ] User management
- [ ] Analytics access

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/device info
5. Screenshots/console logs
6. User role (guest/user/admin)

## Automated Testing (Future)

Consider implementing:
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright/Cypress)
- Load testing (k6/Artillery)

## Conclusion

All tests should pass before deploying to production. Re-test after major changes or updates.

**Target Success Rate**: 95%+ of all tests passing

For production deployment:
1. ✅ All critical features working
2. ✅ Security tests passed
3. ✅ Performance acceptable
4. ✅ Mobile responsive
5. ✅ Browser compatible
6. ✅ Error handling robust
7. ✅ Logging configured
8. ✅ Backups scheduled
9. ✅ Monitoring enabled
10. ✅ Documentation complete