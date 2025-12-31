/**
 * MLNF Dashboard API Integration
 * Real-time data fetching for Viking war room
 */

const API_BASE = 'https://much-love-no-fear.onrender.com/api';

class MLNFDashboard {
    constructor() {
        this.token = localStorage.getItem('mlnf_token');
        this.user = null;
        this.socket = null;
    }

    // Helper for authenticated requests
    async fetch(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired, redirect to login
            window.location.href = '/pages/auth/login.html';
            throw new Error('Unauthorized');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    // Get current user profile
    async getProfile() {
        try {
            const data = await this.fetch('/auth/me');
            this.user = data.user;
            return data.user;
        } catch (error) {
            console.error('Failed to load profile:', error);
            throw error;
        }
    }

    // Get user statistics (videos, followers, etc.)
    async getStats(userId) {
        try {
            // Get user's videos
            const videosData = await this.fetch(`/videos/user/${userId}`);

            // Get runegold balance
            const runegoldData = await this.fetch('/runegold/balance');

            // Calculate total views from videos
            const totalViews = videosData.videos.reduce((sum, v) => sum + (v.views || 0), 0);

            return {
                videos: videosData.pagination.total,
                views: totalViews,
                followers: this.user?.followerCount || 0,
                following: this.user?.followingCount || 0,
                runegold: runegoldData.balance || 0,
                comments: 0 // TODO: Add comment counting when API supports it
            };
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Return zeros if stats fail to load
            return {
                videos: 0,
                views: 0,
                followers: 0,
                following: 0,
                runegold: 0,
                comments: 0
            };
        }
    }

    // Get user's videos
    async getVideos(userId, page = 1, limit = 12) {
        try {
            const data = await this.fetch(`/videos/user/${userId}?page=${page}&limit=${limit}`);
            return {
                videos: data.videos,
                pagination: data.pagination
            };
        } catch (error) {
            console.error('Failed to load videos:', error);
            return { videos: [], pagination: { total: 0, page: 1, pages: 0 } };
        }
    }

    // Get notifications
    async getNotifications() {
        try {
            const data = await this.fetch('/auth/notifications');
            return data.notifications || [];
        } catch (error) {
            console.error('Failed to load notifications:', error);
            return [];
        }
    }

    // Get recent activity (combination of various events)
    async getRecentActivity() {
        try {
            // Get user's recent videos
            const videos = await this.getVideos(this.user._id, 1, 5);

            // Get notifications
            const notifications = await this.getNotifications();

            // Combine and sort by timestamp
            const activity = [
                ...videos.videos.map(v => ({
                    type: 'video',
                    action: 'uploaded',
                    content: v.title,
                    timestamp: v.createdAt,
                    icon: 'fa-video',
                    color: 'gold'
                })),
                ...notifications.slice(0, 10).map(n => ({
                    type: n.type,
                    action: this.getActionFromNotification(n),
                    content: n.message,
                    timestamp: n.createdAt,
                    icon: this.getIconFromNotification(n),
                    color: this.getColorFromNotification(n)
                }))
            ];

            // Sort by timestamp descending
            activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return activity.slice(0, 15);
        } catch (error) {
            console.error('Failed to load activity:', error);
            return [];
        }
    }

    // Helper: Get action text from notification
    getActionFromNotification(notification) {
        const typeMap = {
            'follow': 'started following you',
            'comment': 'commented on your video',
            'like': 'liked your video',
            'tip': 'sent you Runegold',
            'mention': 'mentioned you'
        };
        return typeMap[notification.type] || 'interacted';
    }

    // Helper: Get icon from notification type
    getIconFromNotification(notification) {
        const iconMap = {
            'follow': 'fa-user-plus',
            'comment': 'fa-comment',
            'like': 'fa-heart',
            'tip': 'fa-coins',
            'mention': 'fa-at'
        };
        return iconMap[notification.type] || 'fa-bell';
    }

    // Helper: Get color from notification type
    getColorFromNotification(notification) {
        const colorMap = {
            'follow': 'peach',
            'comment': 'indigo',
            'like': 'red',
            'tip': 'gold',
            'mention': 'purple'
        };
        return colorMap[notification.type] || 'gray';
    }

    // Format timestamp as relative time
    formatRelativeTime(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return then.toLocaleDateString();
    }

    // Animate number counting up (for stats)
    animateCount(element, targetValue, duration = 1000) {
        const start = 0;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (targetValue - start) * easeOut);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        };

        requestAnimationFrame(update);
    }
}

// Export for use in dashboard
window.MLNFDashboard = new MLNFDashboard();
