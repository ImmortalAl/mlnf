/**
 * MLNF Dashboard Initialization
 * Replaces placeholder data with real API integration
 */

(async function initializeDashboard() {
    // Check authentication
    const token = localStorage.getItem('mlnf_token');
    if (!token) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    try {
        // Load user profile
        const user = await window.MLNFDashboard.getProfile();
        console.log('User loaded:', user.username);

        // Update welcome message
        updateWelcomeMessage(user);

        // Load and display stats
        await loadDashboardStats(user._id);

        // Load and display recent activity
        await loadRecentActivity();

        // Load and display user videos
        await loadUserVideos(user._id);

        // Initialize messaging if on messages tab
        initializeMessaging();

    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        // If token is invalid, redirect to login
        if (error.message === 'Unauthorized') {
            localStorage.removeItem('mlnf_token');
            window.location.href = '/pages/auth/login.html';
        }
    }
})();

function updateWelcomeMessage(user) {
    const welcomeElement = document.querySelector('.welcome-message h2');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome back, ${user.username}!`;
    }

    // Update profile avatar if exists
    const avatarElement = document.querySelector('.user-avatar');
    if (avatarElement && user.profilePicture) {
        avatarElement.src = user.profilePicture;
    }
}

async function loadDashboardStats(userId) {
    const statsContainer = document.querySelector('.stats-grid');
    if (!statsContainer) return;

    try {
        const stats = await window.MLNFDashboard.getStats(userId);

        // Create stats HTML
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon">
                        <i class="fas fa-video"></i>
                    </div>
                    <div class="stat-label">Videos</div>
                </div>
                <div class="stat-value" id="stat-videos">0</div>
            </div>

            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="stat-label">Views</div>
                </div>
                <div class="stat-value" id="stat-views">0</div>
            </div>

            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-label">Followers</div>
                </div>
                <div class="stat-value" id="stat-followers">0</div>
            </div>

            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="stat-label">Runegold</div>
                </div>
                <div class="stat-value" id="stat-runegold">0</div>
            </div>
        `;

        // Animate stats counting up
        window.MLNFDashboard.animateCount(document.getElementById('stat-videos'), stats.videos);
        window.MLNFDashboard.animateCount(document.getElementById('stat-views'), stats.views);
        window.MLNFDashboard.animateCount(document.getElementById('stat-followers'), stats.followers);
        window.MLNFDashboard.animateCount(document.getElementById('stat-runegold'), stats.runegold);

    } catch (error) {
        console.error('Failed to load stats:', error);
        statsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load statistics. Please refresh the page.</p>
            </div>
        `;
    }
}

async function loadRecentActivity() {
    const activityContainer = document.querySelector('#recentActivity');
    if (!activityContainer) return;

    try {
        const activities = await window.MLNFDashboard.getRecentActivity();

        if (activities.length === 0) {
            activityContainer.innerHTML = `
                <div class="activity-feed">
                    <div class="activity-feed-header">
                        <i class="fas fa-scroll"></i>
                        Recent Activity
                    </div>
                    <div class="activity-list">
                        <div class="empty-state">
                            <i class="fas fa-wind"></i>
                            <p>No recent activity</p>
                            <small>Your journey begins here, warrior</small>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const activityHTML = activities.map((activity, index) => {
            return `
                <div class="activity-item" style="animation-delay: ${index * 0.05}s">
                    <div class="activity-icon ${activity.color}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-action">${activity.action}</div>
                        <div class="activity-text">${activity.content}</div>
                        <div class="activity-time">${window.MLNFDashboard.formatRelativeTime(activity.timestamp)}</div>
                    </div>
                </div>
            `;
        }).join('');

        activityContainer.innerHTML = `
            <div class="activity-feed">
                <div class="activity-feed-header">
                    <i class="fas fa-scroll"></i>
                    Recent Activity
                </div>
                <div class="activity-list">
                    ${activityHTML}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Failed to load activity:', error);
        activityContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load activity. Please refresh the page.</p>
            </div>
        `;
    }
}

async function loadUserVideos(userId) {
    const videosContainer = document.querySelector('#yourVideos');
    if (!videosContainer) return;

    try {
        const { videos, pagination } = await window.MLNFDashboard.getVideos(userId, 1, 6);

        if (videos.length === 0) {
            videosContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-video"></i>
                    <p>No videos yet</p>
                    <small>Upload your first battle chronicle</small>
                    <a href="/pages/upload.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">
                        <i class="fas fa-upload"></i> Upload Video
                    </a>
                </div>
            `;
            return;
        }

        const videosHTML = videos.map(video => {
            const thumbnailUrl = video.thumbnail || `https://via.placeholder.com/480x270/2D3561/FFD7A1?text=${encodeURIComponent(video.title)}`;
            const viewCount = video.views || 0;
            const uploadDate = new Date(video.createdAt);
            const relativeDate = window.MLNFDashboard.formatRelativeTime(video.createdAt);

            return `
                <div class="video-card" onclick="window.location.href='/pages/watch.html?v=${video._id}'">
                    <img src="${thumbnailUrl}" alt="${video.title}" class="video-thumbnail" onerror="this.src='https://via.placeholder.com/480x270/2D3561/FFD7A1?text=Video'">
                    <div class="video-info">
                        <h3 class="video-title">${video.title}</h3>
                        <div class="video-meta">
                            <span class="video-views">
                                <i class="fas fa-eye"></i>
                                ${viewCount.toLocaleString()}
                            </span>
                            <span class="video-date">${relativeDate}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        videosContainer.innerHTML = `
            <div class="video-grid">
                ${videosHTML}
            </div>
            ${pagination.total > 6 ? `
                <div style="text-align: center; margin-top: 2rem;">
                    <a href="/pages/archive/my-videos.html" class="btn-primary">
                        View All ${pagination.total} Videos
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            ` : ''}
        `;

    } catch (error) {
        console.error('Failed to load videos:', error);
        videosContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load videos. Please refresh the page.</p>
            </div>
        `;
    }
}

function initializeMessaging() {
    // Only initialize if messages section exists
    const messagesSection = document.getElementById('messagesSection');
    if (!messagesSection) return;

    // Check if we're on the messages tab
    const activeTab = localStorage.getItem('activeTab');
    if (activeTab === 'messages') {
        // Initialize RavenMessenger
        if (window.ravenMessenger) {
            window.ravenMessenger.init();
        }
    }
}

// Tab switching handler
document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');

        // Save active tab
        localStorage.setItem('activeTab', tabName);

        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(tabName + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update button states
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');

        // Initialize messaging if messages tab
        if (tabName === 'messages' && window.ravenMessenger) {
            window.ravenMessenger.init();
        }
    });
});

// Restore active tab on page load
window.addEventListener('DOMContentLoaded', () => {
    const activeTab = localStorage.getItem('activeTab') || 'overview';
    const activeButton = document.querySelector(`[data-tab="${activeTab}"]`);
    if (activeButton) {
        activeButton.click();
    }
});

// Logout handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the war room?')) {
            localStorage.removeItem('mlnf_token');
            localStorage.removeItem('activeTab');
            window.location.href = '/pages/auth/login.html';
        }
    });
}
