# MLNF Development Preferences & Requirements

*Last updated: Current Session - Messaging Implementation & Soul Scrolls Planning*

## 🎯 **Site Philosophy & Vision**
- **Quality over Quantity**: Focus on attracting quality users, not mass appeal
- **Free Speech Platform**: Minimal moderation approach
- **Anti-SEO Stance**: "The less that normies come the better" - avoid mass appeal optimization
- **Professional Standards**: Implement features that professional site builders wouldn't overlook

## 📝 **Soul Scrolls (Blogging System) Requirements**

### ✅ **Confirmed Features**
- **Personal Blogs**: Individual user blog posts (NOT community articles)
- **Draft System**: Save drafts functionality is desired
- **Basic Editing**: Simple editor to start with
- **Comments**: User commenting system
- **Likes**: Post appreciation system and dislikes
- **Shares**: Content sharing capabilities
- **Analytics**: Visitor counters and engagement metrics
- **Accessibility**: Screen reader support, keyboard navigation
- **Performance**: Always considered during development

### ❌ **Rejected/Deprioritized Features**
- **Categories**: Not enthusiastic about, consider later
- **Bookmarks**: Not important initially
- **SEO Optimization**: Explicitly not wanted
- **Social Sharing**: Will think about later
- **RSS Feeds**: Needs further persuasion

### 🤔 **Features Needing Education/Discussion**
- **CDN Integration**: User unfamiliar, needs explanation
- **Search Functionality**: User interested, needs elaboration
- **RSS Feeds**: User needs persuasion about benefits
- **Sitemaps**: Good idea, user hadn't considered

### 📊 **Analytics Requirements**
- **Basic Level**: Visitor counter (necessary)
- **Engagement Metrics**: Views, likes, comments
- **User Behavior**: Time on page, bounce rate
- **Content Performance**: Most popular posts, trending topics

## 🏗️ **Content Management Strategy**
- **Community Articles**: Go to "Boundless Chronicles" (separate from personal blogs)
- **News Submissions**: Also go to "Boundless Chronicles"
- **Personal Expression**: Soul Scrolls for individual creativity

## 🔧 **Technical Preferences**
- **Modular Architecture**: Keep components reusable
- **Real-time Features**: WebSocket integration preferred
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Screen reader and keyboard navigation support
- **Performance**: Optimize for speed and user experience

## 📋 **Development Priorities**
1. **Fix Current Issues**: Message modal positioning/display
2. **Complete Messaging**: Real-time functionality
3. **Soul Scrolls Planning**: Architecture and schema design
4. **Blog Implementation**: CRUD operations and UI
5. **Analytics Integration**: Basic visitor tracking
6. **Accessibility Features**: Keyboard navigation, screen readers

## 💡 **Future Considerations**
- **CDN Integration**: Research and explain benefits for media handling
- **Advanced Search**: Full-text search across blog posts
- **RSS Feeds**: Evaluate necessity and user benefits
- **Social Features**: Sharing mechanisms when ready
- **Advanced Analytics**: User engagement patterns, content insights

## 📚 **Educational Explanations & Ideas**

### 🌐 **CDN Integration for Media Handling**
**What is a CDN?**
A Content Delivery Network (CDN) is a network of servers worldwide that store copies of your media files (images, videos, documents).

**Benefits for MLNF:**
- **Speed**: Users download images from the server closest to them
- **Reliability**: If one server fails, others take over
- **Bandwidth Savings**: Reduces load on your main server
- **Global Reach**: Fast loading for users anywhere in the world
- **Cost**: Many CDNs have generous free tiers (Cloudflare, AWS CloudFront)

**Example**: Instead of storing user avatars on your server, you'd store them on Cloudflare CDN. When someone in Japan views a profile, they get the image from a Tokyo server instead of your US server.

### 🔍 **Search Functionality Implementation Ideas**

**Basic Search (Phase 1):**
- Search blog post titles and content
- Filter by author
- Date range filtering
- Simple database LIKE queries

**Advanced Search (Phase 2):**
- Full-text search with relevance scoring
- Search within comments
- Tag-based filtering
- "Similar posts" recommendations
- Elasticsearch or MongoDB text indexes

**AI-Powered Search (Phase 3):**
- Semantic search using embeddings
- Content similarity matching
- Natural language queries

### 📊 **Analytics Expansion Ideas**

**Visitor Analytics:**
- Unique visitors vs returning visitors
- Geographic distribution (countries/regions)
- Device types (mobile/desktop)
- Browser usage patterns
- Peak usage hours/days

**Content Analytics:**
- Most viewed posts
- Average reading time
- Bounce rate per post
- Comment engagement rates
- Like/dislike ratios
- Content performance trends

**User Behavior Analytics:**
- User journey tracking
- Popular navigation paths
- Time spent on different sections
- Reading completion rates
- User retention metrics

**Privacy-Friendly Approach:** Consider self-hosted analytics (like Plausible) instead of Google Analytics to maintain user privacy.

### 📡 **RSS Feeds - The Case For Implementation**

**Why RSS is Actually Valuable:**
- **Power Users Love It**: Quality users likely use RSS readers
- **Decentralized**: Fits anti-mainstream philosophy
- **No Algorithm Manipulation**: Pure chronological content
- **Cross-Platform**: Works with any RSS reader app
- **Direct User Connection**: Like having a direct line to engaged users
- **SEO Alternative**: Helps content discovery without mainstream SEO tactics

**Implementation Benefits:**
- Automatic content syndication
- Increased user retention
- Professional site standard
- Appeals to tech-savvy audience

## 🎨 **UI/UX Preferences**
- **Eternal/Mystical Theme**: Maintain consistent branding
- **Professional Polish**: Features that distinguish from amateur sites
- **User-Friendly**: Intuitive navigation and interactions
- **Accessibility First**: Ensure all users can access content

## [Session Log: Eternal Souls Refactor & Admin Panel]
- Eternal Souls now uses only the shared Active Users sidebar for online status and instant messaging.
- Removed duplicate user sidebar and related code.
- Created 'Immortal's Sanctum' admin panel for site management and analytics.
- Updated documentation and naming for clarity and consistency.

---

*This document should be updated after each development session to maintain accurate preferences and requirements.* 