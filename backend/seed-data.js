/**
 * Database Seed Script for MLNF
 * Populates the database with sample blog posts, news articles, and forum topics
 */

require('dotenv').config();
const mongoose = require('mongoose');
const BlogPost = require('./models/BlogPost');
const NewsArticle = require('./models/NewsArticle');
const ForumTopic = require('./models/ForumTopic');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mlnf', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Sample data
const sampleBlogPosts = [
    {
        title: "The Great Awakening: Understanding the Shift in Global Consciousness",
        slug: "great-awakening-global-consciousness",
        excerpt: "More people are waking up to the truth than ever before. This post explores the massive shift happening worldwide.",
        content: `<p>We are witnessing an unprecedented shift in global consciousness. People from all walks of life are beginning to question the narratives they've been fed for decades.</p>
        
<h2>The Signs Are Everywhere</h2>
<p>From grassroots movements to viral social media posts, the awakening is accelerating. People are connecting dots, sharing information, and refusing to accept manufactured consent.</p>

<h2>Key Areas of Awakening</h2>
<ul>
<li><strong>Health Freedom:</strong> Questioning pharmaceutical monopolies and exploring natural alternatives</li>
<li><strong>Financial Independence:</strong> Understanding central banking manipulation and seeking decentralized solutions</li>
<li><strong>Information Liberation:</strong> Breaking free from mainstream media narratives</li>
<li><strong>Spiritual Connection:</strong> Reconnecting with ancient wisdom and inner truth</li>
</ul>

<h2>What's Next?</h2>
<p>This is just the beginning. As more people wake up, the old systems of control will continue to crumble. The future belongs to those who dare to think for themselves.</p>`,
        category: 'Freedom',
        tags: ['awakening', 'consciousness', 'truth', 'freedom'],
        featured: true,
        published: true,
        views: 12547
    },
    {
        title: "Natural Immunity: What Science Really Says",
        slug: "natural-immunity-science",
        excerpt: "A deep dive into peer-reviewed studies showing the power of natural immune responses.",
        content: `<p>Natural immunity has been a controversial topic, but the science is clear and compelling.</p>

<h2>The Research</h2>
<p>Multiple studies from leading institutions have demonstrated that natural immunity provides robust, long-lasting protection. Yet this information has been systematically suppressed in mainstream discourse.</p>

<h2>Key Findings</h2>
<ul>
<li>Duration of protection exceeds 18 months in most cases</li>
<li>Broad-spectrum immunity to variants</li>
<li>Memory T-cells remain active for years</li>
<li>Lower rates of adverse reactions compared to synthetic alternatives</li>
</ul>`,
        category: 'Health',
        tags: ['health', 'immunity', 'science', 'natural'],
        featured: true,
        published: true,
        views: 8932
    },
    {
        title: "Decentralization: The Path to True Freedom",
        slug: "decentralization-true-freedom",
        excerpt: "Why decentralized systems are the antidote to authoritarian control.",
        content: `<p>Centralized power has always led to corruption. Decentralization offers a way out.</p>

<h2>The Problem with Centralization</h2>
<p>When power concentrates in the hands of a few, those few inevitably abuse it. History proves this time and again.</p>

<h2>Decentralized Solutions</h2>
<ul>
<li><strong>Cryptocurrency:</strong> Money without central banking control</li>
<li><strong>Blockchain:</strong> Transparent, immutable record-keeping</li>
<li><strong>P2P Networks:</strong> Communication without surveillance</li>
<li><strong>DAOs:</strong> Governance without hierarchies</li>
</ul>`,
        category: 'Technology',
        tags: ['decentralization', 'blockchain', 'freedom', 'crypto'],
        published: true,
        views: 6421
    }
];

const sampleNewsArticles = [
    {
        title: "Leaked Documents Reveal Mass Censorship Coordination",
        slug: "leaked-documents-mass-censorship",
        excerpt: "Explosive new documents obtained by independent journalists reveal coordinated censorship efforts.",
        content: `<p>Independent journalists have obtained over 1000 pages of internal documents revealing a coordinated effort between Big Tech companies and government agencies to suppress dissenting voices.</p>

<h2>What the Documents Show</h2>
<p>The leaked files detail specific targeting criteria, automated censorship systems, and communication channels between tech platforms and federal agencies.</p>

<h2>Key Revelations</h2>
<ul>
<li>Weekly coordination meetings between platform executives and government officials</li>
<li>Shared blacklists of accounts to suppress or ban</li>
<li>Algorithms designed to reduce visibility of specific topics</li>
<li>Fast-track removal processes for "flagged" content</li>
</ul>

<p>This story is developing. Stay tuned for updates as more information becomes available.</p>`,
        category: 'Politics',
        breaking: true,
        trending: true,
        source: 'Independent Reporters Network',
        views: 45293
    },
    {
        title: "Natural Treatment Shows 95% Success Rate in Clinical Trial",
        slug: "natural-treatment-clinical-trial",
        excerpt: "A groundbreaking study reveals that a simple natural compound outperforms expensive pharmaceuticals.",
        content: `<p>A peer-reviewed clinical trial published this week shows remarkable results for a natural treatment that Big Pharma doesn't want you to know about.</p>

<h2>The Study</h2>
<p>Conducted over 18 months with 500 participants, the double-blind trial compared the natural compound to leading pharmaceutical alternatives.</p>

<h2>Results</h2>
<ul>
<li>95% success rate vs 67% for pharmaceutical option</li>
<li>Zero serious adverse effects</li>
<li>Cost: Less than $20 per month vs $800+ for prescription</li>
<li>Sustained benefits after treatment cessation</li>
</ul>`,
        category: 'Health',
        trending: true,
        source: 'Alternative Health Research Institute',
        views: 12389
    },
    {
        title: "Central Bank Digital Currencies: The End of Financial Privacy?",
        slug: "cbdc-financial-privacy-threat",
        excerpt: "Governments worldwide are racing to implement CBDCs. What does this mean for your freedom?",
        content: `<p>Over 90 countries are now developing or piloting Central Bank Digital Currencies (CBDCs), but few citizens understand the implications.</p>

<h2>What Are CBDCs?</h2>
<p>Unlike decentralized cryptocurrencies, CBDCs give central banks unprecedented control over money itself.</p>

<h2>Concerns</h2>
<ul>
<li>Every transaction tracked and recorded</li>
<li>Potential for programmable money (use-by dates, restricted purchases)</li>
<li>Elimination of cash alternatives</li>
<li>Direct access to citizen accounts for taxation/confiscation</li>
</ul>`,
        category: 'Finance',
        trending: true,
        source: 'Financial Freedom Watch',
        views: 8745
    }
];

const sampleForumTopics = [
    {
        title: "WHO Treaty Leaked: Shocking Details on Sovereignty Transfer",
        content: `Just received leaked documents from inside sources. The WHO pandemic treaty contains provisions that would allow them to override national sovereignty during "health emergencies."

Key points:
- Member nations must comply with WHO directives
- Mandatory surveillance and data sharing
- Coordinated censorship of "misinformation"
- No opt-out provisions once ratified

This is extremely concerning. Has anyone else seen these documents? What can we do to stop this?`,
        category: 'Politics',
        pinned: true,
        views: 2345,
        replies: [
            {
                content: "This is terrifying. We need to spread awareness immediately. Most people have no idea this is happening.",
                likes: []
            },
            {
                content: "I've been tracking this for months. It's worse than most people realize. The sovereignty implications are massive.",
                likes: []
            }
        ]
    },
    {
        title: "Alternative Energy Breakthrough Suppressed by Big Oil",
        content: `A friend working at a major university shared something disturbing. Their research team developed a highly efficient renewable energy device that could revolutionize power generation.

The university was approached by energy companies offering to "acquire the patent." When they refused, funding was mysteriously cut and the lead researcher was pressured to resign.

This technology could provide clean, affordable energy to millions, but it's being actively suppressed. How do we get this information out there?`,
        category: 'Technology',
        pinned: false,
        views: 1823,
        replies: [
            {
                content: "This happens more often than people think. There's a long history of suppressed energy technologies.",
                likes: []
            }
        ]
    },
    {
        title: "Banking System on Verge of Collapse? - Evidence Thread",
        content: `Collecting evidence that major banks might be in serious trouble. Let's crowdsource our research here.

What I've found so far:
- Unusual derivative positions at major institutions
- Quiet bailouts disguised as "liquidity facilities"
- Insider selling at unprecedented levels
- Media blackout on concerning indicators

Post your findings below. Let's figure out what's really happening.`,
        category: 'Finance',
        views: 1456,
        replies: []
    }
];

// Create sample user for authorship
const createSampleUser = async () => {
    try {
        const existingUser = await User.findOne({ username: 'mlnf_admin' });
        if (existingUser) {
            console.log('✅ Sample user already exists');
            return existingUser._id;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const user = new User({
            username: 'mlnf_admin',
            email: 'admin@mlnf.net',
            password: hashedPassword,
            runeGold: 10000,
            role: 'admin'
        });
        
        await user.save();
        console.log('✅ Created sample user');
        return user._id;
    } catch (error) {
        console.error('Error creating sample user:', error);
        return null;
    }
};

// Seed function
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seed...\n');

        // Create sample user
        const userId = await createSampleUser();
        if (!userId) {
            throw new Error('Failed to create sample user');
        }

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await BlogPost.deleteMany({});
        await NewsArticle.deleteMany({});
        await ForumTopic.deleteMany({});
        console.log('✅ Cleared old data\n');

        // Seed blog posts
        console.log('📝 Seeding blog posts...');
        const blogPosts = sampleBlogPosts.map(post => ({
            ...post,
            author: userId,
            publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last week
        }));
        await BlogPost.insertMany(blogPosts);
        console.log(`✅ Created ${blogPosts.length} blog posts\n`);

        // Seed news articles
        console.log('📰 Seeding news articles...');
        const newsArticles = sampleNewsArticles.map(article => ({
            ...article,
            publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time within last 24 hours
        }));
        await NewsArticle.insertMany(newsArticles);
        console.log(`✅ Created ${newsArticles.length} news articles\n`);

        // Seed forum topics
        console.log('💬 Seeding forum topics...');
        const forumTopics = sampleForumTopics.map(topic => ({
            ...topic,
            author: userId,
            replies: topic.replies.map(reply => ({
                ...reply,
                user: userId,
                createdAt: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000) // Random time within last 6 hours
            }))
        }));
        await ForumTopic.insertMany(forumTopics);
        console.log(`✅ Created ${forumTopics.length} forum topics\n`);

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Blog Posts: ${blogPosts.length}`);
        console.log(`   - News Articles: ${newsArticles.length}`);
        console.log(`   - Forum Topics: ${forumTopics.length}`);
        console.log(`   - Sample User: mlnf_admin (password: admin123)\n`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the seed
seedDatabase();
