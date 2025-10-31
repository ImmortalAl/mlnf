/**
 * MLNF Page Content Loader
 * Populates pages with dynamic content from API
 */

const PageLoader = {
    // Load homepage content
    async loadHomepage() {
        try {
            // Load trending videos
            const trendingContainer = document.getElementById('trendingVideos');
            if (trendingContainer) {
                trendingContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading videos...</div>';
                
                const response = await APIClient.videos.getAll();
                const videos = response.videos || [];
                
                if (videos.length > 0) {
                    trendingContainer.innerHTML = videos.slice(0, 4).map(v => this.renderVideoCard(v)).join('');
                } else {
                    trendingContainer.innerHTML = this.renderEmptyState('No videos yet', 'Be the first to upload content!');
                }
            }
            
            // Load boosted videos
            const boostedContainer = document.getElementById('boostedVideos');
            if (boostedContainer) {
                const response = await APIClient.videos.getAll();
                const boostedVideos = (response.videos || []).filter(v => v.boosted);
                
                if (boostedVideos.length > 0) {
                    boostedContainer.innerHTML = boostedVideos.slice(0, 3).map(v => this.renderVideoCard(v)).join('');
                } else {
                    boostedContainer.innerHTML = this.renderEmptyState('No boosted videos', 'Videos with high engagement appear here');
                }
            }
        } catch (error) {
            console.error('Error loading homepage:', error);
            // Fallback to mock data if API fails
            this.loadHomepageMock();
        }
    },
    
    // Fallback to mock data
    loadHomepageMock() {
        if (typeof MockData !== 'undefined') {
            const trendingContainer = document.getElementById('trendingVideos');
            if (trendingContainer) {
                const videos = MockData.getTrendingVideos().slice(0, 4);
                trendingContainer.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
            }
            
            const boostedContainer = document.getElementById('boostedVideos');
            if (boostedContainer) {
                const videos = MockData.getBoostedVideos().slice(0, 3);
                boostedContainer.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
            }
        }
    },
    
    // Load archive page
    async loadArchive() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;
        
        try {
            videoGrid.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading videos...</div>';
            
            const response = await APIClient.videos.getAll();
            const videos = response.videos || [];
            
            if (videos.length > 0) {
                videoGrid.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
            } else {
                videoGrid.innerHTML = this.renderEmptyState(
                    'No videos in the vault yet',
                    'Be a pioneer! Upload the first video to start the truth movement.',
                    '<a href="#" class="btn btn-viking mt-3"><i class="fas fa-upload"></i> Upload Video</a>'
                );
            }
        } catch (error) {
            console.error('Error loading archive:', error);
            // Fallback to mock data
            if (typeof MockData !== 'undefined') {
                const videos = MockData.videos;
                videoGrid.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
            } else {
                videoGrid.innerHTML = this.renderEmptyState('Failed to load videos', 'Please check your connection and try again.');
            }
        }
    },
    
    // Load blog page
    async loadBlog() {
        const blogContainer = document.getElementById('blogGrid');
        if (!blogContainer) return;
        
        try {
            const response = await APIClient.blog.getAll({ limit: 10 });
            const posts = response.posts || [];
            
            if (posts.length > 0) {
                blogContainer.innerHTML = posts.map(post => this.renderBlogCard(post)).join('');
            } else {
                blogContainer.innerHTML = this.renderEmptyState('No blog posts yet', 'Check back soon for new content!');
            }
        } catch (error) {
            console.error('Error loading blog:', error);
            // Keep static content if API fails
        }
    },
    
    // Load news page
    async loadNews() {
        const newsContainer = document.getElementById('newsFeed');
        if (!newsContainer) return;
        
        try {
            const response = await APIClient.news.getAll({ limit: 20 });
            const articles = response.articles || [];
            
            if (articles.length > 0) {
                newsContainer.innerHTML = articles.map(article => this.renderNewsCard(article)).join('');
            } else {
                newsContainer.innerHTML = this.renderEmptyState('No news articles yet', 'Check back soon for breaking news!');
            }
        } catch (error) {
            console.error('Error loading news:', error);
            // Keep static content if API fails
        }
    },
    
    // Load forum page
    async loadForum() {
        const forumContainer = document.getElementById('forumTopics');
        if (!forumContainer) return;
        
        try {
            const response = await APIClient.forum.getAll({ limit: 20 });
            const topics = response.topics || [];
            
            if (topics.length > 0) {
                forumContainer.innerHTML = topics.map(topic => this.renderForumTopicRow(topic)).join('');
            } else {
                forumContainer.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 3rem;">
                            <i class="fas fa-comments" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem; display: block;"></i>
                            <strong>No topics yet</strong>
                            <p style="color: var(--gray-500); margin-top: 0.5rem;">Be the first to start a discussion!</p>
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error loading forum:', error);
            // Keep static content if API fails
        }
    },
    
    // Load online users sidebar
    loadOnlineUsers() {
        const usersList = document.getElementById('onlineUsersList');
        const onlineCount = document.getElementById('onlineCount');
        
        if (usersList) {
            // For now, use mock data for online users
            // In production, this would be a Socket.io real-time feature
            if (typeof MockData !== 'undefined') {
                const users = MockData.onlineUsers;
                if (users.length > 0) {
                    usersList.innerHTML = users.map(user => `
                        <li class="online-user-item">
                            <div class="flex flex-between">
                                <div class="flex gap-sm">
                                    <div class="avatar-xs" style="background: ${this.getAvatarColor(user.username)}; color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 32px; height: 32px; font-weight: bold;">
                                        ${user.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600;">${user.username}</div>
                                        <div style="font-size: 0.75rem; color: var(--gray-500);">${user.badge}</div>
                                    </div>
                                </div>
                                <div class="online-indicator" style="width: 8px; height: 8px; background: var(--success); border-radius: 50%;"></div>
                            </div>
                        </li>
                    `).join('');
                    
                    if (onlineCount) {
                        onlineCount.textContent = `(${users.length})`;
                    }
                }
            }
        }
    },
    
    // Render empty state
    renderEmptyState(title, message, action = '') {
        return `
            <div class="text-center py-5" style="grid-column: 1 / -1;">
                <i class="fas fa-video" style="font-size: 4rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">${title}</h3>
                <p style="color: var(--gray-500);">${message}</p>
                ${action}
            </div>
        `;
    },
    
    // Render video card
    renderVideoCard(video) {
        // Handle different URL contexts (from root or from pages/)
        const isInSubdir = window.location.pathname.includes('/pages/');
        const videoUrl = video._id ? (isInSubdir ? `video.html?id=${video._id}` : `pages/video.html?id=${video._id}`) : '#';
        
        const thumbnail = video.thumbnail || 'https://via.placeholder.com/400x300?text=Video';
        const duration = video.duration || 0;
        const title = video.title || 'Untitled Video';
        const description = video.description || 'No description available';
        const uploader = video.uploader?.username || 'Unknown';
        const views = video.views || 0;
        
        // Handle upvotes/downvotes - they can be arrays of user IDs or numbers
        const upvotes = Array.isArray(video.upvotes) ? video.upvotes.length : (video.upvotes || 0);
        const downvotes = Array.isArray(video.downvotes) ? video.downvotes.length : (video.downvotes || 0);
        
        // Handle comments - can be array of comments or count
        const comments = Array.isArray(video.comments) ? video.comments.length : (video.comments || 0);
        
        // Check if video is boosted (check if boostExpiresAt exists and is in future)
        const boosted = video.boostExpiresAt ? new Date(video.boostExpiresAt) > new Date() : (video.boosted || false);
        
        return `
            <div class="card video-card">
                <a href="${videoUrl}" style="text-decoration: none; color: inherit;">
                    <div style="position: relative;">
                        <img src="${thumbnail}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-md) var(--radius-md) 0 0;">
                        <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.875rem;">
                            ${this.formatDuration(duration)}
                        </div>
                        ${boosted ? '<div style="position: absolute; top: 8px; right: 8px;" class="badge badge-gold"><i class="fas fa-rocket"></i> Boosted</div>' : ''}
                    </div>
                    <div class="card-body">
                        <h4 style="margin-bottom: 0.5rem; line-height: 1.4;">${title}</h4>
                        <p class="text-muted text-sm" style="margin-bottom: 0.75rem;">${description.substring(0, 80)}${description.length > 80 ? '...' : ''}</p>
                        <div class="flex flex-between text-sm text-muted">
                            <span><i class="fas fa-user"></i> ${uploader}</span>
                            <span><i class="fas fa-eye"></i> ${this.formatNumber(views)}</span>
                        </div>
                        <div class="flex gap-md text-sm mt-2">
                            <span class="text-success"><i class="fas fa-thumbs-up"></i> ${upvotes}</span>
                            <span class="text-muted"><i class="fas fa-thumbs-down"></i> ${downvotes}</span>
                            <span class="text-muted"><i class="fas fa-comment"></i> ${comments}</span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    },
    
    // Format duration (seconds to MM:SS)
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // Get avatar color
    getAvatarColor(username) {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
        ];
        const index = username.charCodeAt(0) % colors.length;
        return colors[index];
    },
    
    // Render blog card
    renderBlogCard(post) {
        const author = post.author?.username || 'Anonymous';
        const date = new Date(post.createdAt).toLocaleDateString();
        const excerpt = post.excerpt || post.content?.substring(0, 150) + '...';
        const likes = post.likes?.length || 0;
        const comments = post.comments?.length || 0;
        
        return `
            <div class="card">
                ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-md) var(--radius-md) 0 0;">` : ''}
                <div class="card-body">
                    <div class="flex gap-sm mb-2">
                        <span class="badge badge-primary">${post.category || 'General'}</span>
                        ${post.featured ? '<span class="badge badge-gold"><i class="fas fa-star"></i> Featured</span>' : ''}
                    </div>
                    <h3><a href="blog-post.html?id=${post._id}" style="text-decoration: none; color: inherit;">${post.title}</a></h3>
                    <p class="text-muted" style="margin: 1rem 0;">${excerpt}</p>
                    <div class="flex flex-between text-sm text-muted">
                        <span><i class="fas fa-user"></i> ${author}</span>
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                    </div>
                    <div class="flex gap-md text-sm mt-2">
                        <span><i class="fas fa-eye"></i> ${this.formatNumber(post.views || 0)}</span>
                        <span><i class="fas fa-heart"></i> ${likes}</span>
                        <span><i class="fas fa-comment"></i> ${comments}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render news card
    renderNewsCard(article) {
        const date = new Date(article.publishedAt || article.createdAt).toLocaleDateString();
        const timeAgo = this.getTimeAgo(new Date(article.publishedAt || article.createdAt));
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="flex gap-sm mb-2">
                        <span class="badge badge-${article.category === 'Breaking' ? 'error' : 'primary'}">${article.category || 'General'}</span>
                        ${article.breaking ? '<span class="badge badge-error animate-pulse">BREAKING</span>' : ''}
                        ${article.trending ? '<span class="badge badge-warning"><i class="fas fa-fire"></i> Trending</span>' : ''}
                    </div>
                    <h3><a href="news-article.html?id=${article._id}" style="text-decoration: none; color: inherit;">${article.title}</a></h3>
                    <p class="text-muted" style="margin: 1rem 0;">${article.excerpt}</p>
                    <div class="flex flex-between text-sm text-muted">
                        <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                        <div class="flex gap-md">
                            <span><i class="fas fa-eye"></i> ${this.formatNumber(article.views || 0)}</span>
                            ${article.source ? `<span><i class="fas fa-external-link-alt"></i> ${article.source}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render forum topic row
    renderForumTopicRow(topic) {
        const author = topic.author?.username || 'Anonymous';
        const lastReplyUser = topic.lastReply?.user?.username || author;
        const lastReplyTime = topic.lastReply?.createdAt ? this.getTimeAgo(new Date(topic.lastReply.createdAt)) : this.getTimeAgo(new Date(topic.createdAt));
        const replyCount = topic.replies?.length || 0;
        
        return `
            <tr style="border-bottom: 1px solid var(--gray-200);">
                <td style="padding: 1rem;">
                    <div class="flex gap-md">
                        ${topic.pinned ? '<i class="fas fa-thumbtack text-warning"></i>' : '<i class="fas fa-comment-dots text-muted"></i>'}
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">
                                <a href="forum-topic.html?id=${topic._id}" style="text-decoration: none; color: inherit;">
                                    ${topic.title}
                                </a>
                            </h4>
                            <div class="text-sm text-muted">
                                <span>by ${author}</span>
                                <span class="badge badge-sm badge-outline">${topic.category || 'General'}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td style="padding: 1rem; text-align: center;">${replyCount}</td>
                <td style="padding: 1rem; text-align: center;">${this.formatNumber(topic.views || 0)}</td>
                <td style="padding: 1rem;">
                    <div class="text-sm">
                        <div>${lastReplyUser}</div>
                        <div class="text-muted">${lastReplyTime}</div>
                    </div>
                </td>
            </tr>
        `;
    },
    
    // Get time ago helper
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
        if (seconds < 2592000) return Math.floor(seconds / 604800) + ' weeks ago';
        return date.toLocaleDateString();
    }
};

// Initialize page content when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on and load appropriate content
    const path = window.location.pathname;
    
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
        PageLoader.loadHomepage();
    } else if (path.includes('archive.html')) {
        // Archive has its own loading script
        // PageLoader.loadArchive();
    } else if (path.includes('blog.html')) {
        PageLoader.loadBlog();
    } else if (path.includes('news.html')) {
        PageLoader.loadNews();
    } else if (path.includes('messageboard.html')) {
        PageLoader.loadForum();
    }
    
    // Load online users on all pages
    PageLoader.loadOnlineUsers();
});

// Make available globally
if (typeof window !== 'undefined') {
    window.PageLoader = PageLoader;
}
