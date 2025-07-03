// Admin Dashboard JavaScript
// Handles the main dashboard overview and statistics

const AdminDashboard = {
    apiBaseUrl: null,
    refreshInterval: null,

    init() {
        this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
        this.setupAdminNavigation();
        this.loadDashboardData();
        this.startAutoRefresh();
        this.setupEventListeners();
    },

    setupAdminNavigation() {
        // Handle admin navigation menu clicks
        const adminNavLinks = document.querySelectorAll('.admin-nav a[href^="#"]');
        
        adminNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('href').substring(1);
                this.switchSection(targetSection);
                
                // Update active state for all navigation elements
                this.updateActiveNavStates(targetSection);
            });
        });

        // Handle initial section based on URL hash
        const initialSection = window.location.hash.substring(1) || 'dashboard';
        this.switchSection(initialSection);
        
        // Update active nav item for initial load
        this.updateActiveNavStates(initialSection);

        // Handle logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout);
        }
    },

    switchSection(sectionName) {
        // Hide all sections
        const allSections = document.querySelectorAll('.admin-section');
        allSections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Update URL hash without triggering page reload
            window.history.replaceState(null, null, `#${sectionName}`);
            
            // Load section-specific data
            this.loadSectionData(sectionName);
            
        } else {
            console.error(`Admin section not found: ${sectionName}. Available sections:`, 
                Array.from(document.querySelectorAll('.admin-section')).map(s => s.id));
        }
    },

    loadSectionData(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'users':
                // Initialize UserManagement if it hasn't been initialized yet
                if (typeof UserManagement !== 'undefined') {
                    if (!UserManagement.apiBaseUrl) {
                        UserManagement.init();
                    } else {
                        UserManagement.loadUsers();
                    }
                } else {
                    console.error('UserManagement module not available - check script loading order');
                    this.showError('User Management module failed to load', 'Please refresh the page');
                }
                break;
            case 'analytics':
                if (typeof AdminAnalytics !== 'undefined' && AdminAnalytics.loadAnalytics) {
                    AdminAnalytics.loadAnalytics();
                }
                break;
            case 'feedback':
                if (typeof AdminFeedback !== 'undefined' && AdminFeedback.loadFeedback) {
                    AdminFeedback.loadFeedback();
                }
                break;
        }
    },

    updateActiveNavStates(activeSection) {
        // Update desktop navigation
        const desktopNavLinks = document.querySelectorAll('.admin-nav a[href^="#"]');
        desktopNavLinks.forEach(link => {
            const section = link.getAttribute('href').substring(1);
            link.classList.toggle('active', section === activeSection);
        });

        // Update mobile navigation
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link[href^="#"]');
        mobileNavLinks.forEach(link => {
            const section = link.getAttribute('href').substring(1);
            link.classList.toggle('active', section === activeSection);
        });

        // Update mobile tab buttons
        const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn[data-section]');
        mobileTabBtns.forEach(btn => {
            const section = btn.dataset.section;
            btn.classList.toggle('active', section === activeSection);
        });
    },

    handleLogout() {
        if (confirm('Are you sure you want to log out from the Immortal\'s Sanctum?')) {
            localStorage.removeItem('sessionToken');
            window.location.href = '/';
        }
    },

    setupEventListeners() {
        // Add event listeners for dashboard controls if needed
        const refreshButton = document.getElementById('refreshDashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.loadDashboardData());
        }
    },

    showError(message, details = '') {
        // Create or update error notification
        let errorContainer = document.getElementById('admin-error-notification');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'admin-error-notification';
            errorContainer.className = 'admin-notification error';
            document.body.appendChild(errorContainer);
        }

        errorContainer.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="notification-text">
                    <strong>${message}</strong>
                    ${details ? `<br><small>${details}</small>` : ''}
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        errorContainer.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorContainer && errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 5000);
    },

    showSuccess(message) {
        // Create success notification
        let successContainer = document.getElementById('admin-success-notification');
        if (!successContainer) {
            successContainer = document.createElement('div');
            successContainer.id = 'admin-success-notification';
            successContainer.className = 'admin-notification success';
            document.body.appendChild(successContainer);
        }

        successContainer.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <div class="notification-text">
                    <strong>${message}</strong>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        successContainer.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (successContainer && successContainer.parentNode) {
                successContainer.remove();
            }
        }, 3000);
    },

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadOverviewStats(),
                this.loadActivityFeed()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data', error.message);
        }
    },

    async loadOverviewStats() {
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No authentication token');

            // Load basic stats
            const usersResponse = await fetch(`${this.apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (usersResponse.ok) {
                const users = await usersResponse.json();
                this.updateOverviewStats({
                    totalUsers: users.length,
                    onlineUsers: users.filter(u => u.online).length,
                    newUsersToday: this.countNewUsersToday(users),
                    activeUsersWeek: this.countActiveUsersWeek(users)
                });
            }
        } catch (error) {
            console.error('Error loading overview stats:', error);
        }
    },

    updateOverviewStats(stats) {
        const elements = {
            totalUsers: document.getElementById('totalUsers'),
            onlineUsers: document.getElementById('onlineUsers'),
            newUsersToday: document.getElementById('newUsersToday'),
            activeUsersWeek: document.getElementById('activeUsersWeek')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = stats[key] || '0';
            }
        });
    },

    async loadActivityFeed() {
        try {
            const activityFeed = document.getElementById('activityFeed');
            if (!activityFeed) return;

            // For now, show a placeholder activity feed
            // This would typically load from a real activity/audit log endpoint
            const activities = [
                {
                    type: 'user_joined',
                    message: 'New soul joined the eternal realm',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000),
                    icon: 'fas fa-user-plus'
                },
                {
                    type: 'post_created',
                    message: 'New chronicle published',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000),
                    icon: 'fas fa-scroll'
                },
                {
                    type: 'comment_added',
                    message: 'Soul shared eternal wisdom',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    icon: 'fas fa-comment'
                }
            ];

            activityFeed.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-message">${activity.message}</p>
                        <span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading activity feed:', error);
            const activityFeed = document.getElementById('activityFeed');
            if (activityFeed) {
                activityFeed.innerHTML = '<p class="error">Failed to load activity feed</p>';
            }
        }
    },

    countNewUsersToday(users) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return users.filter(user => {
            const createdAt = new Date(user.createdAt);
            return createdAt >= today;
        }).length;
    },

    countActiveUsersWeek(users) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return users.filter(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
            return lastLogin && lastLogin >= weekAgo;
        }).length;
    },

    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    },

    startAutoRefresh() {
        // Refresh dashboard data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    },

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    destroy() {
        this.stopAutoRefresh();
    }
};

// Make it globally available
window.AdminDashboard = AdminDashboard;
