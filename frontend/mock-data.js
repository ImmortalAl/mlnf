/**
 * MLNF Mock Data Generator
 * Provides realistic placeholder content when backend is not available
 */

const MockData = {
    // Generate mock videos
    videos: [
        {
            _id: 'vid_001',
            title: 'The Great Awakening: Truth Revealed',
            description: 'Deep dive into the systematic suppression of truth and how we can fight back.',
            thumbnail: 'assets/images/placeholder-video.jpg',
            duration: 1245,
            views: 15234,
            upvotes: 892,
            downvotes: 45,
            comments: 234,
            uploader: {
                username: 'TruthSeeker99',
                _id: 'user_001'
            },
            uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['truth', 'awakening', 'freedom'],
            boosted: true
        },
        {
            _id: 'vid_002',
            title: 'Natural Immunity: The Science They Hide',
            description: 'Comprehensive analysis of suppressed research on natural immunity.',
            thumbnail: 'assets/images/placeholder-video.jpg',
            duration: 987,
            views: 12543,
            upvotes: 723,
            downvotes: 31,
            comments: 156,
            uploader: {
                username: 'HealthWarrior',
                _id: 'user_002'
            },
            uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['health', 'science', 'freedom'],
            boosted: false
        },
        {
            _id: 'vid_003',
            title: 'Financial System Collapse: Prepare Now',
            description: 'Expert analysis on the coming economic reset and how to protect yourself.',
            thumbnail: 'assets/images/placeholder-video.jpg',
            duration: 1567,
            views: 18923,
            upvotes: 1245,
            downvotes: 67,
            comments: 432,
            uploader: {
                username: 'EconViking',
                _id: 'user_003'
            },
            uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['economy', 'finance', 'preparation'],
            boosted: true
        },
        {
            _id: 'vid_004',
            title: 'Mass Meditation for Global Peace',
            description: 'Join thousands in a synchronized meditation to raise planetary consciousness.',
            thumbnail: 'assets/images/placeholder-video.jpg',
            duration: 3600,
            views: 8734,
            upvotes: 567,
            downvotes: 12,
            comments: 89,
            uploader: {
                username: 'LightWorker',
                _id: 'user_004'
            },
            uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['spirituality', 'meditation', 'peace'],
            boosted: false
        }
    ],
    
    // Generate mock blog posts
    blogPosts: [
        {
            _id: 'blog_001',
            title: 'Why Truth Matters More Than Ever',
            excerpt: 'In an age of unprecedented censorship, protecting free speech is critical...',
            content: 'Full article content here...',
            author: 'Sarah Truth-Seeker',
            views: 15234,
            comments: 234,
            category: 'Freedom',
            publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            featured: true
        },
        {
            _id: 'blog_002',
            title: 'Natural Remedies That Actually Work',
            excerpt: 'Exploring suppressed research on natural immunity...',
            content: 'Full article content here...',
            author: 'Dr. Natural',
            views: 8543,
            comments: 156,
            category: 'Health',
            publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            featured: false
        }
    ],
    
    // Generate mock news articles
    newsArticles: [
        {
            _id: 'news_001',
            title: 'Leaked Documents Reveal Mass Censorship Coordination',
            excerpt: 'Explosive documents show Big Tech and government coordination...',
            category: 'Breaking',
            views: 45234,
            comments: 892,
            publishDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            _id: 'news_002',
            title: 'Natural Treatment Shows 95% Success Rate',
            excerpt: 'Groundbreaking study reveals natural compound outperforms pharmaceuticals...',
            category: 'Health',
            views: 12345,
            comments: 234,
            publishDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
    ],
    
    // Generate mock online users
    onlineUsers: [
        { username: 'TruthSeeker99', badge: 'Viking Champion', online: true },
        { username: 'FreedomFighter', badge: 'Truth Warrior', online: true },
        { username: 'HealthWarrior', badge: 'Healer', online: true },
        { username: 'CryptoViking', badge: 'Gold Hoarder', online: true },
        { username: 'NaturalHealer', badge: 'Sage', online: true },
        { username: 'AwakeAndAware', badge: 'Awakened', online: true },
        { username: 'ResearchAnon', badge: 'Investigator', online: true },
        { username: 'LibertyBell', badge: 'Patriot', online: true }
    ],
    
    // Generate mock forum topics
    forumTopics: [
        {
            _id: 'topic_001',
            title: 'BREAKING: Major disclosure coming tomorrow',
            author: 'Insider22',
            replies: 234,
            views: 12543,
            lastPost: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            category: 'General',
            pinned: false,
            hot: true
        },
        {
            _id: 'topic_002',
            title: 'Community Guidelines - Please Read',
            author: 'Admin',
            replies: 45,
            views: 8934,
            lastPost: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            category: 'Announcements',
            pinned: true,
            hot: false
        }
    ],
    
    // Format duration helper
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Format number helper
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    },
    
    // Format date helper
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
        
        return d.toLocaleDateString();
    },
    
    // Get random videos
    getRandomVideos(count = 4) {
        const shuffled = [...this.videos].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },
    
    // Get trending videos
    getTrendingVideos() {
        return [...this.videos].sort((a, b) => b.views - a.views);
    },
    
    // Get boosted videos
    getBoostedVideos() {
        return this.videos.filter(v => v.boosted);
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.MockData = MockData;
}
