# MLNF API Documentation

## Overview

The MLNF (Manifest Liberation, Naturally Free) API provides the backend services for the community platform. This document outlines all available endpoints, authentication mechanisms, data models, and WebSocket events.

## Base Configuration

### API Base URLs
- **Production**: `https://mlnf-auth.onrender.com/api`
- **Local Development**: `http://localhost:3001/api`

### Environment Detection
The frontend automatically detects the environment and uses the appropriate base URL:

```javascript
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalDevelopment ? 'http://localhost:3001/api' : 'https://mlnf-auth.onrender.com/api';
```

## Authentication

### Authentication Flow

The MLNF platform uses JWT (JSON Web Token) based authentication with session tokens stored in localStorage.

#### Token Storage
```javascript
// Token is stored in localStorage
localStorage.setItem('sessionToken', token);
localStorage.setItem('user', JSON.stringify(userData));

// API requests include Bearer token
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
};
```

#### Authentication Endpoints

##### Register User
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "token": "string",
    "user": {
        "_id": "string",
        "username": "string",
        "displayName": "string",
        "avatar": "string",
        "title": "string",
        "status": "string",
        "createdAt": "string",
        "isVIP": "boolean",
        "role": "string",
        "online": "boolean"
    }
}
```

##### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "token": "string",
    "user": {
        "_id": "string",
        "username": "string",
        "displayName": "string",
        "avatar": "string",
        "title": "string",
        "status": "string",
        "createdAt": "string",
        "isVIP": "boolean",
        "role": "string",
        "online": "boolean"
    }
}
```

##### Logout User
```http
POST /api/auth/logout
```

**Headers:** Requires Authorization Bearer token

**Response:**
```json
{
    "message": "Logged out successfully"
}
```

## User Management

### User Endpoints

##### Get Current User
```http
GET /api/users/me
```

**Headers:** Requires Authorization Bearer token

**Response:**
```json
{
    "_id": "string",
    "username": "string",
    "displayName": "string",
    "avatar": "string",
    "title": "string",
    "status": "string",
    "email": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "isVIP": "boolean",
    "role": "string",
    "online": "boolean",
    "privacy": {
        "emailVisible": "boolean",
        "profilePublic": "boolean"
    }
}
```

##### Get Extended User Profile
```http
GET /api/users/me/extended
```

**Headers:** Requires Authorization Bearer token

**Response:** Extended user data with additional analytics and settings

##### Get User by Username
```http
GET /api/users/:username
```

**Headers:** Optional Authorization Bearer token

**Response:**
```json
{
    "_id": "string",
    "username": "string",
    "displayName": "string",
    "avatar": "string",
    "title": "string",
    "status": "string",
    "createdAt": "string",
    "isVIP": "boolean",
    "role": "string",
    "online": "boolean"
}
```

##### Update Current User
```http
PATCH /api/users/me
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "displayName": "string",
    "status": "string",
    "avatar": "string",
    "privacy": {
        "emailVisible": "boolean",
        "profilePublic": "boolean"
    }
}
```

##### List Users (Fallback)
```http
GET /api/users?page={page}&limit={limit}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
    "docs": [
        {
            "_id": "string",
            "username": "string",
            "displayName": "string",
            "avatar": "string",
            "title": "string",
            "online": "boolean"
        }
    ],
    "totalDocs": "number",
    "limit": "number",
    "page": "number",
    "totalPages": "number"
}
```

##### Get Online Users
```http
GET /api/users/online
```

**Response:**
```json
[
    {
        "_id": "string",
        "username": "string",
        "displayName": "string",
        "avatar": "string",
        "title": "string",
        "online": "boolean",
        "lastSeen": "string"
    }
]
```

### Advanced User Management

##### Advanced Profile Update
```http
POST /api/users/advanced-profile
```

**Headers:** Requires Authorization Bearer token

##### Follow User
```http
POST /api/users/:userId/follow
```

**Headers:** Requires Authorization Bearer token

##### Unfollow User
```http
DELETE /api/users/:userId/follow
```

**Headers:** Requires Authorization Bearer token

##### Block User
```http
POST /api/users/:userId/block
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "reason": "string"
}
```

##### Unblock User
```http
DELETE /api/users/:userId/block
```

**Headers:** Requires Authorization Bearer token

##### Report User
```http
POST /api/users/:userId/report
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "reason": "string",
    "description": "string"
}
```

##### Search Users
```http
GET /api/users/search?q={query}&type={type}&location={location}
```

**Query Parameters:**
- `q`: Search query
- `type`: Search type filter
- `location`: Location filter

##### Get Suggested Users
```http
GET /api/users/suggested
```

**Headers:** Requires Authorization Bearer token

##### Find Nearby Users
```http
POST /api/users/nearby
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "location": {
        "lat": "number",
        "lng": "number"
    }
}
```

##### Get User Analytics
```http
GET /api/users/:userId/analytics
```

**Headers:** Requires Authorization Bearer token

##### Update User Reputation
```http
POST /api/users/:userId/reputation
```

**Headers:** Requires Authorization Bearer token

##### Award User Badge
```http
POST /api/users/:userId/badges
```

**Headers:** Requires Authorization Bearer token

## Content Management

### Chronicles (News/Posts)

##### Get Chronicles
```http
GET /api/chronicles?page={page}&limit={limit}&sort={sort}
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page (default: 15)
- `sort`: Sort order (`newest`, `oldest`, `mostValidated`, `mostChallenged`)

**Response:**
```json
{
    "docs": [
        {
            "_id": "string",
            "title": "string",
            "content": "string",
            "author": {
                "_id": "string",
                "username": "string",
                "displayName": "string",
                "avatar": "string",
                "title": "string",
                "isVIP": "boolean",
                "role": "string",
                "online": "boolean"
            },
            "createdAt": "string",
            "updatedAt": "string",
            "isEdited": "boolean",
            "validations": "number",
            "challenges": "number",
            "category": "string"
        }
    ],
    "totalDocs": "number",
    "limit": "number",
    "page": "number",
    "totalPages": "number"
}
```

##### Get Single Chronicle
```http
GET /api/chronicles/:id
```

**Response:** Single chronicle object with same structure as above

##### Create Chronicle
```http
POST /api/chronicles
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "title": "string",
    "content": "string",
    "category": "string"
}
```

##### Update Chronicle
```http
PUT /api/chronicles/:id
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "title": "string",
    "content": "string",
    "category": "string"
}
```

##### Delete Chronicle
```http
DELETE /api/chronicles/:id
```

**Headers:** Requires Authorization Bearer token

##### Validate Chronicle
```http
POST /api/chronicles/:id/validate
```

**Headers:** Requires Authorization Bearer token

##### Challenge Chronicle
```http
POST /api/chronicles/:id/challenge
```

**Headers:** Requires Authorization Bearer token

### Blog Posts (Soul Scrolls)

##### Get Blog Posts
```http
GET /api/blogs?page={page}&limit={limit}&sort={sort}&author={username}
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `sort`: Sort order (`createdAt`, etc.)
- `author`: Filter by author username

**Response:**
```json
{
    "docs": [
        {
            "_id": "string",
            "title": "string",
            "content": "string",
            "author": {
                "_id": "string",
                "username": "string",
                "displayName": "string",
                "avatar": "string",
                "online": "boolean"
            },
            "createdAt": "string",
            "updatedAt": "string",
            "isDraft": "boolean"
        }
    ]
}
```

##### Create Blog Post
```http
POST /api/blogs
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "title": "string",
    "content": "string",
    "isDraft": "boolean"
}
```

##### Update Blog Post
```http
PUT /api/blogs/:id
```

**Headers:** Requires Authorization Bearer token

##### Delete Blog Post
```http
DELETE /api/blogs/:id
```

**Headers:** Requires Authorization Bearer token

### Comments (Eternal Echoes)

##### Get Comments
```http
GET /api/comments/:targetType/:targetId
```

**Path Parameters:**
- `targetType`: Type of content (`blog`, `chronicle`, `thread`)
- `targetId`: ID of the target content

**Response:**
```json
[
    {
        "_id": "string",
        "content": "string",
        "author": {
            "_id": "string",
            "username": "string",
            "displayName": "string",
            "avatar": "string",
            "title": "string",
            "isVIP": "boolean",
            "role": "string",
            "online": "boolean"
        },
        "targetType": "string",
        "targetId": "string",
        "createdAt": "string",
        "updatedAt": "string",
        "isEdited": "boolean"
    }
]
```

##### Create Comment
```http
POST /api/comments
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "content": "string",
    "targetType": "string",
    "targetId": "string"
}
```

##### Update Comment
```http
PUT /api/comments/:id
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "content": "string"
}
```

##### Delete Comment
```http
DELETE /api/comments/:id
```

**Headers:** Requires Authorization Bearer token

### Message Board (Threads)

##### Get Threads
```http
GET /api/threads?limit={limit}
```

**Query Parameters:**
- `limit`: Number of threads to return

**Response:**
```json
[
    {
        "_id": "string",
        "title": "string",
        "content": "string",
        "author": {
            "_id": "string",
            "username": "string",
            "displayName": "string",
            "avatar": "string"
        },
        "createdAt": "string",
        "replies": "number",
        "category": "string"
    }
]
```

##### Get Single Thread
```http
GET /api/threads/:id
```

**Response:** Single thread with replies

##### Create Thread
```http
POST /api/threads
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "title": "string",
    "content": "string",
    "category": "string"
}
```

##### Update Thread
```http
PUT /api/threads/:id
```

**Headers:** Requires Authorization Bearer token

##### Reply to Thread
```http
POST /api/threads/:id/replies
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "content": "string"
}
```

##### Update Reply
```http
PUT /api/threads/:threadId/replies/:replyId
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "content": "string"
}
```

##### Vote on Thread/Reply
```http
POST /api/threads/:threadId/vote
POST /api/threads/:threadId/replies/:replyId/vote
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "vote": "up" | "down"
}
```

## Governance & Democracy

### Proposals

##### Get Proposals
```http
GET /api/governance/proposals?threadId={threadId}
```

**Query Parameters:**
- `threadId`: Filter proposals by associated thread

**Response:**
```json
[
    {
        "_id": "string",
        "title": "string",
        "description": "string",
        "author": {
            "_id": "string",
            "username": "string"
        },
        "status": "draft" | "voting" | "passed" | "rejected",
        "createdAt": "string",
        "votingEndsAt": "string",
        "votes": {
            "yes": "number",
            "no": "number",
            "abstain": "number"
        },
        "threadId": "string"
    }
]
```

##### Get Single Proposal
```http
GET /api/governance/proposals/:id
```

**Response:** Single proposal object

##### Create Proposal
```http
POST /api/governance/proposals
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "title": "string",
    "description": "string",
    "threadId": "string"
}
```

##### Vote on Proposal
```http
POST /api/governance/proposals/:id/vote
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "choice": "yes" | "no" | "abstain"
}
```

##### Start Voting
```http
POST /api/governance/proposals/:id/start-voting
```

**Headers:** Requires Authorization Bearer token

### Community Moderation

##### Get Moderation Cases
```http
GET /api/community-mod/cases?status={status}
```

**Query Parameters:**
- `status`: Filter by case status (`voting`, etc.)

##### Vote on Moderation Case
```http
POST /api/community-mod/vote-case
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "caseId": "string",
    "choice": "string"
}
```

##### Flag User
```http
POST /api/community-mod/flag-user
```

**Headers:** Requires Authorization Bearer token

### Anonymous Submissions

##### Get Anonymous Sections
```http
GET /api/anonymous/sections
```

**Response:**
```json
[
    {
        "_id": "string",
        "name": "string",
        "description": "string",
        "submissionCount": "number"
    }
]
```

##### Submit Anonymous Content
```http
POST /api/anonymous/submit
```

**Request Body:**
```json
{
    "sectionId": "string",
    "title": "string",
    "content": "string"
}
```

##### Get Anonymous Submissions
```http
GET /api/anonymous/submissions/:sectionId
```

## Mindmap System

### Mindmap Endpoints

##### Get Mindmap Data
```http
GET /api/mindmap
```

**Response:**
```json
{
    "nodes": [
        {
            "_id": "string",
            "title": "string",
            "description": "string",
            "author": {
                "_id": "string",
                "username": "string"
            },
            "position": {
                "x": "number",
                "y": "number"
            },
            "credibility": "number",
            "votes": {
                "up": "number",
                "down": "number"
            },
            "labels": ["string"],
            "citations": ["string"],
            "createdAt": "string"
        }
    ],
    "edges": [
        {
            "_id": "string",
            "source": "string",
            "target": "string",
            "relationshipLabel": "string",
            "author": {
                "_id": "string",
                "username": "string"
            },
            "strength": "number",
            "createdAt": "string"
        }
    ]
}
```

##### Create Mindmap Node
```http
POST /api/mindmap/nodes
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "title": "string",
    "description": "string",
    "position": {
        "x": "number",
        "y": "number"
    },
    "labels": ["string"]
}
```

##### Update Mindmap Node
```http
PUT /api/mindmap/nodes/:id
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "title": "string",
    "description": "string",
    "labels": ["string"]
}
```

##### Delete Mindmap Node
```http
DELETE /api/mindmap/nodes/:id
```

**Headers:** Requires Authorization Bearer token

##### Vote on Mindmap Node
```http
POST /api/mindmap/nodes/:id/vote
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "vote": "up" | "down"
}
```

##### Add Node Citations
```http
POST /api/mindmap/nodes/:id/citations
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "url": "string",
    "title": "string"
}
```

##### Create Mindmap Edge
```http
POST /api/mindmap/edges
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "source": "string",
    "target": "string",
    "relationshipLabel": "string"
}
```

##### Update Mindmap Edge
```http
PUT /api/mindmap/edges/:id
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "relationshipLabel": "string"
}
```

##### Delete Mindmap Edge
```http
DELETE /api/mindmap/edges/:id
```

**Headers:** Requires Authorization Bearer token

##### Search Mindmap
```http
GET /api/mindmap/search?q={query}
```

**Query Parameters:**
- `q`: Search query

##### Get Label Suggestions
```http
GET /api/mindmap/labels/suggestions?q={query}
```

**Query Parameters:**
- `q`: Partial label text

## Messaging System

### Direct Messages

##### Send Message
```http
POST /api/messages/send
```

**Headers:** Requires Authorization Bearer token

**Request Body:**
```json
{
    "recipient": "string",
    "content": "string"
}
```

##### Get Conversation
```http
GET /api/messages/conversation/:username
```

**Headers:** Requires Authorization Bearer token

**Response:**
```json
{
    "messages": [
        {
            "_id": "string",
            "sender": {
                "_id": "string",
                "username": "string",
                "displayName": "string",
                "avatar": "string"
            },
            "recipient": {
                "_id": "string",
                "username": "string",
                "displayName": "string",
                "avatar": "string"
            },
            "content": "string",
            "timestamp": "string",
            "read": "boolean"
        }
    ]
}
```

### Owl Messaging (Email Fallback)

##### Send Owl Whisper
```http
POST /api/owls/whisper
```

**Request Body:**
```json
{
    "to": "string",
    "from": "string",
    "subject": "string",
    "message": "string"
}
```

**Response:**
```json
{
    "success": "boolean",
    "message": "string"
}
```

## Admin Features

### Highlights Management

##### Get Soul Scrolls Highlights
```http
GET /api/highlights/soul_scrolls
```

**Response:**
```json
{
    "featured": {
        "_id": "string",
        "title": "string",
        "author": {
            "username": "string",
            "displayName": "string",
            "avatar": "string"
        },
        "excerpt": "string",
        "createdAt": "string"
    }
}
```

##### Get Echoes Unbound Highlights
```http
GET /api/highlights/echoes_unbound
```

##### Feature Content (Admin)
```http
POST /api/highlights/admin-feature
```

**Headers:** Requires Authorization Bearer token (Admin role)

**Request Body:**
```json
{
    "type": "string",
    "contentId": "string",
    "featuredUntil": "string"
}
```

## WebSocket Real-time Features

### WebSocket Connection

The MLNF platform uses WebSocket for real-time features. The WebSocket endpoint automatically converts the API base URL:

```javascript
// Convert HTTP URL to WebSocket URL
const wsUrl = MLNF_CONFIG.API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '');
const fullUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
```

### WebSocket Events

#### Client to Server Events

##### Connection
```javascript
// Automatically sent on connection
{
    "type": "connection",
    "token": "string"
}
```

##### Typing Indicator
```javascript
{
    "type": "typing",
    "recipientId": "string",
    "isTyping": "boolean"
}
```

#### Server to Client Events

##### Connection Confirmation
```javascript
{
    "type": "connection",
    "status": "connected",
    "userId": "string"
}
```

##### New Message
```javascript
{
    "type": "newMessage",
    "message": {
        "_id": "string",
        "sender": {
            "_id": "string",
            "username": "string",
            "displayName": "string",
            "avatar": "string"
        },
        "recipient": {
            "_id": "string",
            "username": "string"
        },
        "content": "string",
        "timestamp": "string"
    }
}
```

##### Message Delivered
```javascript
{
    "type": "messageDelivered",
    "messageId": "string",
    "recipientId": "string"
}
```

##### Typing Indicator
```javascript
{
    "type": "typing",
    "senderId": "string",
    "recipientId": "string",
    "isTyping": "boolean"
}
```

##### User Status Update
```javascript
{
    "type": "userStatus",
    "userId": "string",
    "status": "online" | "offline",
    "lastSeen": "string"
}
```

### WebSocket Client Methods

```javascript
// Available on window.MLNF.websocket
window.MLNF.websocket.connect()              // Connect to WebSocket
window.MLNF.websocket.disconnect()           // Disconnect from WebSocket
window.MLNF.websocket.send(data)             // Send data to server
window.MLNF.websocket.on(type, handler)      // Register event handler
window.MLNF.websocket.off(type, handler)     // Remove event handler
window.MLNF.websocket.sendTypingIndicator(recipientId, isTyping)  // Send typing indicator
window.MLNF.websocket.isUserOnline(userId)   // Check if user is online
window.MLNF.websocket.getOnlineUsers()       // Get list of online users
```

## Error Handling

### Standard Error Response Format

All endpoints return errors in a consistent format:

```json
{
    "error": "string",
    "message": "string",
    "details": "string" // optional
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Authentication Error Handling

When a `401` error is received, the frontend automatically:
1. Shows the login modal
2. Clears invalid tokens
3. Updates the UI to reflect logged-out state

```javascript
// Automatic handling in apiClient.js
if (response.status === 401 && window.authManager) {
    window.authManager.showLogin();
}
```

## Rate Limiting and Caching

### Caching Strategy (Service Worker)

The platform implements intelligent caching for different endpoint types:

```javascript
// Cache configurations
'/api/users/online': { strategy: 'networkFirst', ttl: 30000 },    // 30 seconds
'/api/users/me': { strategy: 'networkFirst', ttl: 300000 },       // 5 minutes
'/api/blogs': { strategy: 'staleWhileRevalidate', ttl: 600000 },  // 10 minutes
'/api/chronicles': { strategy: 'staleWhileRevalidate', ttl: 600000 }
```

### Request Headers

All API requests include cache control headers:

```javascript
headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
}
```

## Data Models

### User Model
```javascript
{
    "_id": "ObjectId",
    "username": "string",
    "displayName": "string",
    "email": "string",
    "avatar": "string",
    "title": "string",
    "status": "string",
    "role": "string", // "user", "admin", "moderator"
    "isVIP": "boolean",
    "online": "boolean",
    "lastSeen": "Date",
    "privacy": {
        "emailVisible": "boolean",
        "profilePublic": "boolean"
    },
    "createdAt": "Date",
    "updatedAt": "Date"
}
```

### Chronicle Model
```javascript
{
    "_id": "ObjectId",
    "title": "string",
    "content": "string",
    "author": "ObjectId | User",
    "category": "string",
    "validations": "number",
    "challenges": "number",
    "isEdited": "boolean",
    "createdAt": "Date",
    "updatedAt": "Date"
}
```

### Blog Post Model
```javascript
{
    "_id": "ObjectId",
    "title": "string",
    "content": "string",
    "author": "ObjectId | User",
    "isDraft": "boolean",
    "createdAt": "Date",
    "updatedAt": "Date"
}
```

### Comment Model
```javascript
{
    "_id": "ObjectId",
    "content": "string",
    "author": "ObjectId | User",
    "targetType": "string", // "blog", "chronicle", "thread"
    "targetId": "ObjectId",
    "isEdited": "boolean",
    "createdAt": "Date",
    "updatedAt": "Date"
}
```

### Thread Model
```javascript
{
    "_id": "ObjectId",
    "title": "string",
    "content": "string",
    "author": "ObjectId | User",
    "category": "string",
    "replies": ["ObjectId"],
    "votes": {
        "up": "number",
        "down": "number"
    },
    "createdAt": "Date",
    "updatedAt": "Date"
}
```

### Message Model
```javascript
{
    "_id": "ObjectId",
    "sender": "ObjectId | User",
    "recipient": "ObjectId | User",
    "content": "string",
    "read": "boolean",
    "timestamp": "Date"
}
```

### Mindmap Node Model
```javascript
{
    "_id": "ObjectId",
    "title": "string",
    "description": "string",
    "author": "ObjectId | User",
    "position": {
        "x": "number",
        "y": "number"
    },
    "credibility": "number",
    "votes": {
        "up": "number",
        "down": "number"
    },
    "labels": ["string"],
    "citations": ["string"],
    "createdAt": "Date",
    "updatedAt": "Date"
}
```

### Mindmap Edge Model
```javascript
{
    "_id": "ObjectId",
    "source": "ObjectId",
    "target": "ObjectId",
    "relationshipLabel": "string",
    "author": "ObjectId | User",
    "strength": "number",
    "createdAt": "Date",
    "updatedAt": "Date"
}
```

## Development Notes

### Frontend Integration

The API is consumed by the frontend using a centralized `apiClient`:

```javascript
// Available globally as window.apiClient
await window.apiClient.get('/users/me');
await window.apiClient.post('/chronicles', data);
await window.apiClient.put('/users/me', updateData);
await window.apiClient.delete('/chronicles/123');
```

### Authentication State Management

Authentication state is managed by `authManager`:

```javascript
// Available globally as window.authManager
window.authManager.isLoggedIn()     // Check auth status
window.authManager.getUser()        // Get current user
window.authManager.getToken()       // Get session token
window.authManager.login(token, user)  // Handle login
window.authManager.logout()         // Handle logout
```

### Error Handling Best Practices

1. Always check response status before parsing JSON
2. Provide user-friendly error messages
3. Handle network errors gracefully
4. Implement retry logic for transient failures
5. Log errors for debugging while keeping user feedback clean

```javascript
try {
    const response = await window.apiClient.get('/api/endpoint');
    // Handle success
} catch (error) {
    if (error.response?.status === 404) {
        // Handle not found
    } else if (error.response?.status === 401) {
        // Handle unauthorized (handled automatically)
    } else {
        // Handle other errors
        console.error('API Error:', error);
    }
}
```

---

This documentation covers all major API endpoints and patterns used in the MLNF platform. For implementation details, refer to the source code in `/components/shared/apiClient.js` and related service files.