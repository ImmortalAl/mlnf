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

        // Add refresh button for activity feed
        const refreshActivityBtn = document.getElementById('refreshActivityFeed');
        if (refreshActivityBtn) {
            refreshActivityBtn.addEventListener('click', () => {
                refreshActivityBtn.classList.add('rotating');
                this.loadActivityFeed().then(() => {
                    setTimeout(() => {
                        refreshActivityBtn.classList.remove('rotating');
                    }, 500);
                });
            });
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
                const stats = {
                    // With 30-day sessions, "online" = has valid session (logged in within 30 days)
                    onlineUsers: this.countActiveSessionUsers(users),
                    dailyActiveUsers: this.countDailyActiveUsers(users)
                };
                
                this.updateSimplifiedStats(stats);
                this.loadRecentActiveUsers(users);
                this.loadPlatformHealth();
            }
        } catch (error) {
            console.error('Error loading overview stats:', error);
        }
    },

    updateSimplifiedStats(stats) {
        const elements = {
            onlineUsers: document.getElementById('onlineUsers'),
            dailyActiveUsers: document.getElementById('dailyActiveUsers')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = stats[key] || '0';
            }
        });
    },

    countActiveSessionUsers(users) {
        // 30-day sessions: anyone with valid session is considered "online"
        // This assumes backend properly expires sessions after 30 days
        // For now, we'll use lastLogin as proxy until backend implements session expiry
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return users.filter(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
            return lastLogin && lastLogin >= thirtyDaysAgo;
        }).length;
    },

    countDailyActiveUsers(users) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return users.filter(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
            return lastLogin && lastLogin >= yesterday;
        }).length;
    },

    loadRecentActiveUsers(users) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const recentUsers = users.filter(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
            return lastLogin && lastLogin >= twoHoursAgo;
        }).sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin)).slice(0, 5);

        const container = document.getElementById('recentActiveUsers');
        if (container) {
            const loadingDiv = container.querySelector('.activity-loading');
            if (recentUsers.length === 0) {
                if (loadingDiv) loadingDiv.textContent = 'No recent activity';
            } else {
                const activityHtml = recentUsers.map(user => {
                    const timeAgo = this.formatTimeAgo(new Date(user.lastLogin));
                    const status = user.online ? 'online now' : timeAgo;
                    return `<div class="recent-user">• ${user.displayName || user.username} - ${status}</div>`;
                }).join('');
                
                if (loadingDiv) {
                    loadingDiv.innerHTML = activityHtml;
                    loadingDiv.className = 'recent-activity-content';
                }
            }
        }
    },

    async loadPlatformHealth() {
        const healthElements = {
            serverResponseTime: document.getElementById('serverResponseTime'),
            failedLogins: document.getElementById('failedLogins'),
            peakHours: document.getElementById('peakHours')
        };

        // Real server response time monitoring
        if (healthElements.serverResponseTime) {
            try {
                const startTime = performance.now();
                // Use the backend API health endpoint
                const baseUrl = this.apiBaseUrl.replace('/api', '');
                const response = await fetch(`${baseUrl}/health`, {
                    method: 'GET',
                    mode: 'cors'
                });
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);
                
                healthElements.serverResponseTime.textContent = `${responseTime}ms`;
                
                // Add visual indicator based on response time
                const element = healthElements.serverResponseTime;
                element.className = 'stat-value';
                if (responseTime > 500) {
                    element.classList.add('health-critical');
                } else if (responseTime > 200) {
                    element.classList.add('health-warning');
                } else {
                    element.classList.add('health-good');
                }
            } catch (error) {
                healthElements.serverResponseTime.textContent = 'Error';
                healthElements.serverResponseTime.className = 'stat-value health-critical';
            }
        }

        // Get real platform health data
        try {
            const healthResponse = await fetch(`${this.apiBaseUrl}/activity/platform-health`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
                }
            });
            
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                
                if (healthElements.failedLogins) {
                    healthElements.failedLogins.textContent = healthData.failedLogins;
                    
                    // Add visual indicator for failed logins
                    const element = healthElements.failedLogins;
                    element.className = 'stat-value';
                    if (healthData.failedLogins > 10) {
                        element.classList.add('health-critical');
                    } else if (healthData.failedLogins > 5) {
                        element.classList.add('health-warning');
                    } else {
                        element.classList.add('health-good');
                    }
                }
                
                if (healthElements.peakHours) {
                    healthElements.peakHours.textContent = healthData.peakHours;
                }
            } else {
                // Fallback values if API fails
                if (healthElements.failedLogins) {
                    healthElements.failedLogins.textContent = '--';
                }
                if (healthElements.peakHours) {
                    healthElements.peakHours.textContent = '--';
                }
            }
        } catch (error) {
            console.error('Failed to load platform health data:', error);
            // Fallback values
            if (healthElements.failedLogins) {
                healthElements.failedLogins.textContent = '--';
            }
            if (healthElements.peakHours) {
                healthElements.peakHours.textContent = '--';
            }
        }
    },

    async loadActivityFeed() {
        try {
            const activityFeed = document.getElementById('activityFeed');
            if (!activityFeed) return;

            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No authentication token');

            // Show loading state
            activityFeed.innerHTML = '<div class="activity-loading">Loading recent activity...</div>';

            // Fetch recent data from multiple sources
            // Note: Comments endpoint requires target type/id, so we'll skip it for now
            const [blogsRes, threadsRes, usersRes] = await Promise.all([
                fetch(`${this.apiBaseUrl}/blogs?limit=10&sort=-createdAt`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${this.apiBaseUrl}/threads?limit=10&sort=-createdAt`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${this.apiBaseUrl}/users?limit=10&sort=-createdAt`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            // Process responses with proper error handling
            const [blogs, threads, users] = await Promise.all([
                blogsRes.ok ? blogsRes.json().catch(() => []) : [],
                threadsRes.ok ? threadsRes.json().catch(() => []) : [],
                usersRes.ok ? usersRes.json().catch(() => []) : []
            ]);

            // Ensure all responses are arrays
            const safeBlogs = Array.isArray(blogs) ? blogs : [];
            const safeThreads = Array.isArray(threads) ? threads : [];
            const safeUsers = Array.isArray(users) ? users : [];

            // Combine and format activities
            const activities = [];

            // Add blog activities
            safeBlogs.forEach(blog => {
                if (blog.author && blog.createdAt) {
                    activities.push({
                        type: 'blog_created',
                        message: `${blog.author.displayName || blog.author.username || 'A soul'} published "${blog.title || 'Untitled Soul Scroll'}"`,
                        timestamp: new Date(blog.createdAt),
                        icon: 'fas fa-scroll'
                    });
                }
            });


            // Add thread activities
            safeThreads.forEach(thread => {
                if (thread.author && thread.createdAt) {
                    activities.push({
                        type: 'thread_created',
                        message: `${thread.author.displayName || thread.author.username || 'A soul'} started "${thread.title || 'Untitled Echo'}"`,
                        timestamp: new Date(thread.createdAt),
                        icon: 'fas fa-comments'
                    });
                }
            });

            // Add new user activities
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            safeUsers.forEach(user => {
                if (user.createdAt && new Date(user.createdAt) > oneDayAgo) {
                    activities.push({
                        type: 'user_joined',
                        message: `${user.displayName || user.username} joined the eternal realm`,
                        timestamp: new Date(user.createdAt),
                        icon: 'fas fa-user-plus'
                    });
                }
            });

            // Sort by timestamp and take most recent 10
            activities.sort((a, b) => b.timestamp - a.timestamp);
            const recentActivities = activities.slice(0, 10);

            // Display activities
            if (recentActivities.length === 0) {
                activityFeed.innerHTML = '<p class="no-activity">No recent activity</p>';
            } else {
                activityFeed.innerHTML = recentActivities.map(activity => `
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
            }

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
