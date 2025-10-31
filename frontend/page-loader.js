/**
 * MLNF Page Content Loader
 * Populates pages with dynamic content (mock or real from API)
 */

const PageLoader = {
    // Load homepage content
    loadHomepage() {
        // Load trending videos
        const trendingContainer = document.getElementById('trendingVideos');
        if (trendingContainer) {
            const videos = MockData.getTrendingVideos().slice(0, 4);
            trendingContainer.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
        }
        
        // Load boosted videos
        const boostedContainer = document.getElementById('boostedVideos');
        if (boostedContainer) {
            const videos = MockData.getBoostedVideos().slice(0, 3);
            boostedContainer.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
        }
    },
    
    // Load archive page
    loadArchive() {
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            const videos = MockData.videos;
            videoGrid.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
        }
    },
    
    // Load blog page
    loadBlog() {
        // Featured article is already in HTML
        // Could load more blog posts here
    },
    
    // Load news page
    loadNews() {
        // News items are already in HTML
        // Could load more news here
    },
    
    // Load online users sidebar
    loadOnlineUsers() {
        const usersList = document.getElementById('onlineUsersList');
        const onlineCount = document.getElementById('onlineCount');
        
        if (usersList) {
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
    },
    
    // Render video card
    renderVideoCard(video) {
        return `
            <div class="card video-card">
                <div style="position: relative;">
                    <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-md) var(--radius-md) 0 0;">
                    <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.875rem;">
                        ${MockData.formatDuration(video.duration)}
                    </div>
                    ${video.boosted ? '<div style="position: absolute; top: 8px; right: 8px;" class="badge badge-gold"><i class="fas fa-rocket"></i> Boosted</div>' : ''}
                </div>
                <div class="card-body">
                    <h4 style="margin-bottom: 0.5rem; line-height: 1.4;">${video.title}</h4>
                    <p class="text-muted text-sm" style="margin-bottom: 0.75rem;">${video.description.substring(0, 80)}...</p>
                    <div class="flex flex-between text-sm text-muted">
                        <span><i class="fas fa-user"></i> ${video.uploader.username}</span>
                        <span><i class="fas fa-eye"></i> ${MockData.formatNumber(video.views)}</span>
                    </div>
                    <div class="flex gap-md text-sm mt-2">
                        <span class="text-success"><i class="fas fa-thumbs-up"></i> ${video.upvotes}</span>
                        <span class="text-muted"><i class="fas fa-thumbs-down"></i> ${video.downvotes}</span>
                        <span class="text-muted"><i class="fas fa-comment"></i> ${video.comments}</span>
                    </div>
                </div>
            </div>
        `;
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
    }
};

// Initialize page content when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on and load appropriate content
    const path = window.location.pathname;
    
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
        PageLoader.loadHomepage();
    } else if (path.includes('archive.html')) {
        PageLoader.loadArchive();
    } else if (path.includes('blog.html')) {
        PageLoader.loadBlog();
    } else if (path.includes('news.html')) {
        PageLoader.loadNews();
    }
    
    // Load online users on all pages
    PageLoader.loadOnlineUsers();
});

// Make available globally
if (typeof window !== 'undefined') {
    window.PageLoader = PageLoader;
}
