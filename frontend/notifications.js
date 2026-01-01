/**
 * 🔔 HORN OF VALHALLA - Viking Notification System
 * Real-time notifications for warriors of MLNF
 */

const NotificationSystem = {
    panel: null,
    bell: null,
    badge: null,
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    checkInterval: null,

    init() {
        console.log('🔔 Initializing Horn of Valhalla...');
        
        this.bell = document.getElementById('notificationBell');
        this.badge = document.getElementById('notificationBadge');

        if (!this.bell) {
            console.warn('Notification bell not found in DOM');
            return;
        }

        // Create notification panel
        this.createPanel();

        // Add click handler to bell
        this.bell.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.panel.contains(e.target) && !this.bell.contains(e.target)) {
                this.closePanel();
            }
        });

        // Load initial notifications
        if (MLNFAuth && MLNFAuth.isLoggedIn()) {
            this.bell.classList.remove('hidden');
            this.loadNotifications();
            
            // Check for new notifications every 30 seconds
            this.checkInterval = setInterval(() => {
                this.loadNotifications(true);
            }, 30000);
        }

        // Listen for Socket.io notification events
        if (window.socket) {
            window.socket.on('notification', (data) => {
                console.log('🔔 New notification via socket:', data);
                this.addNotification(data);
                this.playSound();
            });
        }

        console.log('✅ Horn of Valhalla ready!');
    },

    createPanel() {
        // Create panel HTML
        this.panel = document.createElement('div');
        this.panel.id = 'notificationPanel';
        this.panel.className = 'notification-panel';
        this.panel.innerHTML = `
            <div class="notification-panel-header">
                <h3><i class="fas fa-horn"></i> Battle Signals</h3>
                <button class="btn-text" onclick="NotificationSystem.markAllRead()">
                    <i class="fas fa-check-double"></i> Mark all read
                </button>
            </div>
            <div class="notification-panel-body" id="notificationList">
                <div class="notification-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading signals from the realm...</p>
                </div>
            </div>
            <div class="notification-panel-footer">
                <a href="dashboard.html#notifications" class="btn-text">
                    View all notifications →
                </a>
            </div>
        `;

        // Add styles
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification-bell {
                    position: relative;
                    cursor: pointer;
                    padding: 0.5rem;
                    transition: all 0.2s ease;
                }

                .notification-bell:hover {
                    transform: scale(1.1);
                }

                .notification-bell i {
                    font-size: 1.25rem;
                    color: var(--cream);
                }

                .notification-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: var(--error);
                    color: white;
                    border-radius: 50%;
                    min-width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.625rem;
                    font-weight: bold;
                    animation: bounce 0.5s ease;
                }

                @keyframes bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }

                .notification-panel {
                    position: fixed;
                    top: 120px; /* Below header */
                    right: 300px; /* Account for sidebar */
                    width: 380px;
                    max-width: calc(100vw - 320px);
                    background: white;
                    border: 2px solid var(--gold);
                    border-radius: var(--radius-lg);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 1100; /* Higher than sidebar (1001) */
                    display: none;
                    max-height: 600px;
                    overflow: hidden;
                }

                .notification-panel.open {
                    display: flex;
                    flex-direction: column;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .notification-panel-header {
                    padding: 1rem;
                    border-bottom: 2px solid var(--gold);
                    background: linear-gradient(135deg, var(--navy), var(--indigo));
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .notification-panel-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                }

                .notification-panel-header .btn-text {
                    color: var(--gold);
                    font-size: 0.875rem;
                }

                .notification-panel-body {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 400px;
                }

                .notification-loading,
                .notification-empty {
                    padding: 3rem 2rem;
                    text-align: center;
                    color: var(--gray-500);
                }

                .notification-item {
                    padding: 1rem;
                    border-bottom: 1px solid var(--gray-200);
                    cursor: pointer;
                    transition: background 0.2s ease;
                    display: flex;
                    gap: 0.75rem;
                }

                .notification-item:hover {
                    background: var(--gray-50);
                }

                .notification-item.unread {
                    background: var(--primary-light);
                    border-left: 4px solid var(--gold);
                }

                .notification-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 1.25rem;
                }

                .notification-icon.follow { background: var(--indigo); color: white; }
                .notification-icon.like { background: var(--error); color: white; }
                .notification-icon.comment { background: var(--success); color: white; }
                .notification-icon.runegold { background: var(--gold); color: white; }
                .notification-icon.badge { background: var(--peach); color: white; }
                .notification-icon.system { background: var(--gray-600); color: white; }

                .notification-content {
                    flex: 1;
                }

                .notification-message {
                    font-size: 0.875rem;
                    margin-bottom: 0.25rem;
                    line-height: 1.4;
                }

                .notification-time {
                    font-size: 0.75rem;
                    color: var(--gray-500);
                }

                .notification-panel-footer {
                    padding: 0.75rem 1rem;
                    border-top: 1px solid var(--gray-200);
                    text-align: center;
                }

                .notification-panel-footer .btn-text {
                    color: var(--indigo);
                    font-weight: 600;
                }
            `;
            document.head.appendChild(styles);
        }

        // Append to body for proper z-index stacking (above sidebar)
        document.body.appendChild(this.panel);
    },

    async loadNotifications(silent = false) {
        if (!MLNFAuth.isLoggedIn()) return;

        try {
            const token = localStorage.getItem('mlnf_token');
            const response = await fetch('http://localhost:5000/api/auth/notifications', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load notifications');

            const data = await response.json();
            this.notifications = data.notifications || [];
            this.updateBadge();
            
            if (!silent) {
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            if (!silent) {
                this.renderError();
            }
        }
    },

    renderNotifications() {
        const listEl = document.getElementById('notificationList');
        if (!listEl) return;

        if (this.notifications.length === 0) {
            listEl.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash" style="font-size: 3rem; color: var(--gray-300);"></i>
                    <p style="margin-top: 1rem;">No battle signals yet, warrior!</p>
                    <p style="font-size: 0.875rem; opacity: 0.7;">You'll receive notifications for follows, comments, and more</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = this.notifications
            .slice(0, 10) // Show last 10
            .map(notif => this.renderNotificationItem(notif))
            .join('');
    },

    renderNotificationItem(notif) {
        const icon = this.getNotificationIcon(notif.type);
        const timeAgo = this.getTimeAgo(new Date(notif.createdAt));
        const unreadClass = notif.read ? '' : 'unread';

        return `
            <div class="notification-item ${unreadClass}" 
                 onclick="NotificationSystem.handleNotificationClick('${notif._id}', '${notif.type}')">
                <div class="notification-icon ${notif.type}">
                    ${icon}
                </div>
                <div class="notification-content">
                    <div class="notification-message">${this.escapeHtml(notif.message)}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            </div>
        `;
    },

    getNotificationIcon(type) {
        const icons = {
            follow: '<i class="fas fa-user-plus"></i>',
            like: '<i class="fas fa-heart"></i>',
            comment: '<i class="fas fa-comment"></i>',
            runegold: '<i class="fas fa-coins"></i>',
            badge: '<i class="fas fa-medal"></i>',
            system: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.system;
    },

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
        return Math.floor(seconds / 604800) + ' weeks ago';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    renderError() {
        const listEl = document.getElementById('notificationList');
        if (!listEl) return;

        listEl.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error);"></i>
                <p style="margin-top: 1rem;">Failed to load notifications</p>
                <button class="btn btn-sm btn-viking mt-2" onclick="NotificationSystem.loadNotifications()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    },

    updateBadge() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (this.unreadCount > 0) {
            this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.badge.classList.remove('hidden');
        } else {
            this.badge.classList.add('hidden');
        }
    },

    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    },

    openPanel() {
        this.panel.classList.add('open');
        this.isOpen = true;
        this.loadNotifications();
    },

    closePanel() {
        this.panel.classList.remove('open');
        this.isOpen = false;
    },

    async handleNotificationClick(notificationId, type) {
        await this.markAsRead(notificationId);
        
        // Navigate based on notification type
        // You can customize these routes
        switch (type) {
            case 'follow':
                window.location.href = 'dashboard.html';
                break;
            case 'comment':
            case 'like':
                // Navigate to the video
                break;
            default:
                break;
        }
    },

    async markAsRead(notificationId) {
        try {
            const token = localStorage.getItem('mlnf_token');
            await fetch(`http://localhost:5000/api/auth/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Update local state
            const notif = this.notifications.find(n => n._id === notificationId);
            if (notif) {
                notif.read = true;
                this.updateBadge();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    async markAllRead() {
        const unreadNotifications = this.notifications.filter(n => !n.read);
        
        for (const notif of unreadNotifications) {
            await this.markAsRead(notif._id);
        }

        this.closePanel();
    },

    addNotification(notification) {
        this.notifications.unshift(notification);
        this.updateBadge();
        
        if (this.isOpen) {
            this.renderNotifications();
        }
    },

    playSound() {
        // Viking horn sound!
        if (typeof window.Audio !== 'undefined') {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6F0fPTgjMGHm7A7+OZVA0OVqvl8K1jHAY6k9jyzn0vBS2Bz/LajTYHI2+98NuXQw0PXLLo7a1kHQc5kdv0xXwxBS2B0PPWhTAFKXTF8diSOQkUZ7vr8KRYEwxNouLxtmwmBzGJ1vLNeDAFKHLG8d2SPQoUY7zr8KHYFZJNAAAAABJRU5ErkJggg==');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore if blocked
        }
    },

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationSystem.init());
} else {
    NotificationSystem.init();
}

// Export for global access
window.NotificationSystem = NotificationSystem;
