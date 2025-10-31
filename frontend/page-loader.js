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
    loadBlog() {
        // Blog content is static HTML for now
        // Could load dynamic blog posts here in the future
    },
    
    // Load news page
    loadNews() {
        // News content is static HTML for now
        // Could load dynamic news here in the future
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
        const videoUrl = video._id ? `pages/video.html?id=${video._id}` : '#';
        const thumbnail = video.thumbnail || 'https://via.placeholder.com/400x300?text=Video';
        const duration = video.duration || 0;
        const title = video.title || 'Untitled Video';
        const description = video.description || 'No description available';
        const uploader = video.uploader?.username || 'Unknown';
        const views = video.views || 0;
        const upvotes = video.upvotes || 0;
        const downvotes = video.downvotes || 0;
        const comments = video.comments || 0;
        const boosted = video.boosted || false;
        
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
