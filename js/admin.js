// Eternal Dominion - Admin Panel JavaScript
(function() {
    'use strict';
    
    // State
    let currentSection = 'dashboard';
    let currentPage = 1;
    const itemsPerPage = 10;
    let allUsers = [];
    let isAdmin = false;
    
    // DOM Elements
    const sections = document.querySelectorAll('.admin-section');
    const navLinks = document.querySelectorAll('.admin-nav a');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Initialize managers
    let userManager;
    let analyticsManager;
    let feedbackManager;

    function initializeManagers() {
        userManager = new UserManager();
        analyticsManager = new AnalyticsManager();
        feedbackManager = new FeedbackManager();
    }
    
    // Check admin authorization
    async function checkAdminAuth() {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            window.location.href = '/pages/auth.html';
            return false;
        }
        
        try {
            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Unauthorized');
            }
            
            const userData = await response.json();
            
            // Check if user is admin (you'll need to implement this field in your backend)
            // For now, check username - in production, use proper role checking
            if (userData.username === 'ImmortalAl' || userData.role === 'admin') {
                isAdmin = true;
                document.getElementById('adminUsername').textContent = userData.displayName || userData.username;
                return true;
            } else {
                alert('Access denied. Administrator privileges required.');
                window.location.href = '/';
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/pages/auth.html';
            return false;
        }
    }
    
    // Navigation
    function setupNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                
                if (target === '') {
                    // Return to main site
                    return;
                }
                
                showSection(target);
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }
    
    function showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav links
        document.querySelectorAll('.admin-nav a').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to corresponding nav link
        const navLink = document.querySelector(`.admin-nav a[href="#${sectionId}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // Load section-specific data
        switch (sectionId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'users':
                if (userManager) userManager.loadUsers();
                break;
            case 'feedback':
                if (feedbackManager) feedbackManager.loadFeedback();
                break;
            case 'analytics':
                if (analyticsManager) analyticsManager.loadAnalytics();
                break;
        }
    }
    
    // Dashboard
    async function loadDashboard() {
        try {
            // Load stats
            await loadStats();
            
            // Load recent activity
            await loadRecentActivity();
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }
    
    async function loadStats() {
        const token = localStorage.getItem('sessionToken');
        
        try {
            // Fetch total users
            const usersResponse = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (usersResponse.ok) {
                const responseData = await usersResponse.json();
                console.log('[Admin] Response from /users in loadStats:', responseData); // Log the data
                
                // Ensure usersArray is an array
                let usersArray = [];
                if (Array.isArray(responseData)) {
                    usersArray = responseData;
                } else if (responseData && Array.isArray(responseData.data)) { // Common pattern: { data: [...] }
                    usersArray = responseData.data;
                } else if (responseData && Array.isArray(responseData.users)) { // Another common pattern: { users: [...] }
                    usersArray = responseData.users;
                }
                // Add more checks here if other structures are possible based on console output

                document.getElementById('totalUsers').textContent = usersArray.length || '0';
                
                const onlineCount = usersArray.filter(u => u.online).length;
                document.getElementById('onlineUsers').textContent = onlineCount;
            } else {
                console.error('[Admin] Failed to fetch users for stats:', usersResponse.status, usersResponse.statusText);
                document.getElementById('totalUsers').textContent = 'Error';
                document.getElementById('onlineUsers').textContent = 'Error';
            }
            
            // TODO: Replace placeholder post/message counts with real API calls when endpoints are available
            document.getElementById('totalPosts').textContent = '0'; // Keep as placeholder or fetch if API ready
            document.getElementById('totalMessages').textContent = '0'; // Keep as placeholder
            
        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('totalUsers').textContent = 'Error';
            document.getElementById('onlineUsers').textContent = 'Error';
        }
    }
    
    async function loadRecentActivity() {
        const activityFeed = document.getElementById('activityFeed');
        
        // TODO: Replace placeholder activity with real recent activity data from backend
        activityFeed.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-user-plus activity-icon"></i>
                <div class="activity-content">
                    <strong>New soul manifested</strong>
                    <p>A new user joined the eternal sanctuary</p>
                </div>
                <span class="activity-time">Just now</span>
            </div>
        `;
    }
    
    // User Management
    async function loadUsers() {
        const token = localStorage.getItem('sessionToken');
        const tbody = document.getElementById('usersTableBody');
        
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Summoning souls...</td></tr>';
        
        try {
            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                console.error('[Admin] Failed to fetch users for user list:', response.status, response.statusText);
                throw new Error('Failed to fetch users');
            }
            
            const responseData = await response.json();
            console.log('[Admin] Response from /users in loadUsers:', responseData); // Log the data

            // Ensure allUsers is an array
            if (Array.isArray(responseData)) {
                allUsers = responseData;
            } else if (responseData && Array.isArray(responseData.data)) { // Common pattern: { data: [...] }
                allUsers = responseData.data;
            } else if (responseData && Array.isArray(responseData.users)) { // Another common pattern: { users: [...] }
                allUsers = responseData.users;
            } else {
                allUsers = []; // Default to empty array if structure is not as expected
                console.warn('[Admin] Unexpected response structure from /users. Expected an array or an object with a "data" or "users" array property. Treating as empty list.');
            }
            
            displayUsers();
            
        } catch (error) {
            console.error('Error loading users:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="error">Failed to summon souls. Check console.</td></tr>';
        }
    }
    
    function displayUsers() {
        const tbody = document.getElementById('usersTableBody');
        const filterStatus = document.getElementById('filterStatus').value;
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        
        // Filter users
        let filteredUsers = allUsers;
        
        if (filterStatus !== 'all') {
            filteredUsers = filteredUsers.filter(user => {
                if (filterStatus === 'online') return user.online;
                if (filterStatus === 'offline') return !user.online;
                if (filterStatus === 'banned') return user.banned;
                return true;
            });
        }
        
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                (user.username && user.username.toLowerCase().includes(searchTerm)) ||
                (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
                (user.email && user.email.toLowerCase().includes(searchTerm))
            );
        }
        
        // Paginate
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        // Display users
        if (paginatedUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No souls found</td></tr>';
            return;
        }
        
        tbody.innerHTML = paginatedUsers.map(user => `
            <tr>
                <td><img src="${user.avatar || window.MLNF_CONFIG.DEFAULT_AVATAR}" alt="${user.username}" class="user-avatar"></td>
                <td>${user.username}</td>
                <td>${user.displayName || '--'}</td>
                <td><span class="user-status status-${user.online ? 'online' : 'offline'}">${user.online ? 'Online' : 'Offline'}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="viewUser('${user.username}')">View</button>
                        <button class="action-btn" onclick="editUser('${user.username}')">Edit</button>
                        <button class="action-btn danger" onclick="banUser('${user.username}')">Ban</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update pagination
        updatePagination(filteredUsers.length);
    }
    
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const pagination = document.getElementById('usersPagination');
        
        let html = '';
        
        if (currentPage > 1) {
            html += `<button class="page-btn" onclick="changePage(${currentPage - 1})">Previous</button>`;
        }
        
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }
        
        if (currentPage < totalPages) {
            html += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Next</button>`;
        }
        
        pagination.innerHTML = html;
    }
    
    // Analytics
    async function loadAnalytics() {
        // Initialize charts
        initCharts();
        
        // Load metrics
        loadMetrics();
    }
    
    function initCharts() {
        // User Growth Chart
        const userGrowthCtx = document.getElementById('userGrowthChart').getContext('2d');
        new Chart(userGrowthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Souls',
                    data: [12, 19, 23, 35, 42, 55],
                    borderColor: 'rgb(255, 94, 120)',
                    backgroundColor: 'rgba(255, 94, 120, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0e6ff'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#f0e6ff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#f0e6ff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
        
        // Activity Chart
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Daily Activity',
                    data: [65, 59, 80, 81, 56, 55, 70],
                    backgroundColor: 'rgba(255, 202, 40, 0.5)',
                    borderColor: 'rgb(255, 202, 40)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0e6ff'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#f0e6ff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#f0e6ff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }
    
    function loadMetrics() {
        // TODO: Replace placeholder analytics/chart data with real data after site launch
        document.getElementById('avgSession').textContent = '12m 34s';
        document.getElementById('dailyActive').textContent = '42';
        document.getElementById('contentRate').textContent = '3.2/day';
        document.getElementById('engagement').textContent = '87%';
    }
    
    // User Actions
    window.viewUser = function(username) {
        const user = allUsers.find(u => u.username === username);
        if (!user) return;
        
        const modal = document.getElementById('userModal');
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = `
            <div class="user-details">
                <img src="${user.avatar || window.MLNF_CONFIG.DEFAULT_AVATAR}" alt="${user.username}" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 1rem;">
                <h4>${user.displayName || user.username}</h4>
                <p>@${user.username}</p>
                <p>Status: ${user.status || 'No status set'}</p>
                <p>Bio: ${user.bio || 'No bio available'}</p>
                <p>Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
                <p>Email: ${user.email || 'Not provided'}</p>
            </div>
        `;
        
        modal.classList.add('active');
    };
    
    window.editUser = function(username) {
        const user = allUsers.find(u => u.username === username);
        if (!user) return;
        const modal = document.getElementById('userModal');
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="user-details">
                <img src="${user.avatar || window.MLNF_CONFIG.DEFAULT_AVATAR}" alt="${user.username}" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 1rem;">
                <h4>Edit Soul: ${user.displayName || user.username}</h4>
                <label>Display Name: <input type="text" id="editDisplayName" value="${user.displayName || ''}"></label><br>
                <label>Status: <input type="text" id="editStatus" value="${user.status || ''}"></label><br>
                <label>Bio: <textarea id="editBio">${user.bio || ''}</textarea></label><br>
                <label>Email: <input type="email" id="editEmail" value="${user.email || ''}"></label><br>
                <button id="saveUserBtn">Save</button>
            </div>
            <div id="editUserFeedback"></div>
        `;
        modal.classList.add('active');
        document.getElementById('saveUserBtn').onclick = async function() {
            const displayName = document.getElementById('editDisplayName').value;
            const status = document.getElementById('editStatus').value;
            const bio = document.getElementById('editBio').value;
            const email = document.getElementById('editEmail').value;
            const token = localStorage.getItem('sessionToken');
            try {
                const res = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/${username}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ displayName, status, bio, email })
                });
                if (!res.ok) throw new Error('Failed to update user');
                document.getElementById('editUserFeedback').textContent = 'Saved!';
                await loadUsers();
            } catch (err) {
                document.getElementById('editUserFeedback').textContent = 'Error: ' + err.message;
            }
        };
    };
    
    window.banUser = async function(username) {
        if (!confirm(`Are you sure you want to banish ${username} from the eternal sanctuary?`)) return;
        const token = localStorage.getItem('sessionToken');
        try {
            // Try PATCH first, fallback to DELETE if needed
            let res = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/${username}/ban`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                // Try DELETE as fallback
                res = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/${username}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            if (!res.ok) throw new Error('Failed to ban user');
            alert('User banished!');
            await loadUsers();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };
    
    window.changePage = function(page) {
        currentPage = page;
        displayUsers();
    };
    
    // Event Listeners
    function setupEventListeners() {
        // Logout
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/pages/auth.html';
        });
        
        // Search
        document.getElementById('userSearch').addEventListener('input', displayUsers);
        document.getElementById('filterStatus').addEventListener('change', displayUsers);
        
        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('userModal').classList.remove('active');
        });
    }
    
    // Initialize
    async function init() {
        // Check admin auth first
        const authorized = await checkAdminAuth();
        if (!authorized) return;
        
        // Setup navigation
        setupNavigation();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial section
        loadDashboard();
    }
    
    // Initialize admin panel
    init();
    
    // Initialize managers after DOM is ready
    initializeManagers();
    
    // Show dashboard by default
    showSection('dashboard');

    // Feedback Management
    class FeedbackManager {
        constructor() {
            this.currentPage = 1;
            this.currentFilter = 'all';
            this.feedbackData = [];
            
            this.init();
        }
        
        init() {
            // Event listeners
            const refreshBtn = document.getElementById('refreshFeedback');
            const filterSelect = document.getElementById('filterFeedback');
            
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.loadFeedback());
            }
            
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    this.currentFilter = e.target.value;
                    this.currentPage = 1;
                    this.loadFeedback();
                });
            }
        }
        
        async loadFeedback(page = 1) {
            try {
                const token = localStorage.getItem('sessionToken');
                if (!token) {
                    throw new Error('Authentication required');
                }
                
                this.showLoading();
                
                const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/feedback?page=${page}&limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to load feedback: ${response.status}`);
                }
                
                const data = await response.json();
                this.feedbackData = data.feedback || [];
                
                this.updateStats(data);
                this.renderFeedback();
                this.renderPagination(data.pagination);
                
            } catch (error) {
                console.error('Load feedback error:', error);
                this.showError('Failed to load feedback. Please try again.');
            }
        }
        
        updateStats(data) {
            const totalFeedback = data.pagination?.total || this.feedbackData.length;
            const anonymousFeedback = this.feedbackData.filter(f => f.feedbackMetadata?.anonymous).length;
            const pendingReplies = this.feedbackData.filter(f => !f.replied).length; // You can track this with additional field
            
            const totalEl = document.getElementById('totalFeedback');
            const anonymousEl = document.getElementById('anonymousFeedback');
            const pendingEl = document.getElementById('pendingReplies');
            
            if (totalEl) totalEl.textContent = totalFeedback;
            if (anonymousEl) anonymousEl.textContent = anonymousFeedback;
            if (pendingEl) pendingEl.textContent = pendingReplies;
        }
        
        renderFeedback() {
            const feedbackList = document.getElementById('feedbackList');
            if (!feedbackList) return;
            
            if (!this.feedbackData || this.feedbackData.length === 0) {
                feedbackList.innerHTML = `
                    <div class="feedback-empty">
                        <i class="fas fa-heart"></i>
                        <h3>No Feedback Yet</h3>
                        <p>When users share their eternal wisdom, it will appear here.</p>
                    </div>
                `;
                return;
            }
            
            let filteredFeedback = this.feedbackData;
            
            // Apply filters
            switch (this.currentFilter) {
                case 'anonymous':
                    filteredFeedback = this.feedbackData.filter(f => f.feedbackMetadata?.anonymous);
                    break;
                case 'identified':
                    filteredFeedback = this.feedbackData.filter(f => !f.feedbackMetadata?.anonymous && f.sender);
                    break;
                case 'recent':
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    filteredFeedback = this.feedbackData.filter(f => new Date(f.timestamp) > weekAgo);
                    break;
            }
            
            const feedbackHTML = filteredFeedback.map(feedback => this.createFeedbackItem(feedback)).join('');
            feedbackList.innerHTML = feedbackHTML;
        }
        
        createFeedbackItem(feedback) {
            const isAnonymous = feedback.feedbackMetadata?.anonymous || !feedback.sender;
            const timestamp = new Date(feedback.timestamp).toLocaleString();
            const senderInfo = isAnonymous 
                ? { displayName: 'Anonymous Soul', username: 'anonymous' }
                : (feedback.sender || feedback.feedbackMetadata?.senderInfo);
            
            const avatar = isAnonymous 
                ? '<div class="avatar anonymous-avatar"><i class="fas fa-user-secret"></i></div>'
                : `<div class="avatar">${(senderInfo?.displayName || senderInfo?.username || 'U')[0].toUpperCase()}</div>`;
            
            const replyButton = !isAnonymous && senderInfo?.username 
                ? `<button class="btn btn-primary" onclick="feedbackManager.openReplyModal('${feedback._id}', '${senderInfo.username}')">
                     <i class="fas fa-reply"></i> Reply
                   </button>`
                : '';
            
            return `
                <div class="feedback-item" data-id="${feedback._id}">
                    <div class="feedback-header">
                        <div class="feedback-sender">
                            ${avatar}
                            <div class="feedback-sender-info">
                                <h4>${senderInfo?.displayName || senderInfo?.username || 'Anonymous Soul'}</h4>
                                <p>${isAnonymous ? 'Anonymous feedback' : `@${senderInfo?.username || 'unknown'}`}</p>
                            </div>
                        </div>
                        <div class="feedback-meta">
                            <div class="feedback-timestamp">${timestamp}</div>
                            <div class="feedback-badges">
                                <span class="feedback-badge ${isAnonymous ? 'anonymous' : 'identified'}">
                                    ${isAnonymous ? 'Anonymous' : 'Identified'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="feedback-content">
                        ${feedback.content.replace(/\n/g, '<br>')}
                    </div>
                    <div class="feedback-actions">
                        ${replyButton}
                        <button class="btn btn-secondary" onclick="feedbackManager.deleteFeedback('${feedback._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }
        
        openReplyModal(feedbackId, username) {
            const feedback = this.feedbackData.find(f => f._id === feedbackId);
            if (!feedback || !username) return;
            
            // Use the existing message modal or create a new one
            if (window.MLNF && window.MLNF.openMessageModal) {
                window.MLNF.openMessageModal(username);
            } else {
                // Fallback: redirect to messaging page
                window.location.href = `/souls/${username}`;
            }
        }
        
        async deleteFeedback(feedbackId) {
            if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
                return;
            }
            
            try {
                const token = localStorage.getItem('sessionToken');
                const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/${feedbackId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete feedback');
                }
                
                // Remove from local data and re-render
                this.feedbackData = this.feedbackData.filter(f => f._id !== feedbackId);
                this.renderFeedback();
                this.updateStats({ pagination: { total: this.feedbackData.length } });
                
            } catch (error) {
                console.error('Delete feedback error:', error);
                alert('Failed to delete feedback. Please try again.');
            }
        }
        
        renderPagination(pagination) {
            const paginationEl = document.getElementById('feedbackPagination');
            if (!paginationEl || !pagination) return;
            
            const { page, pages, total } = pagination;
            
            if (pages <= 1) {
                paginationEl.innerHTML = '';
                return;
            }
            
            let paginationHTML = '<div class="pagination-controls">';
            
            // Previous button
            if (page > 1) {
                paginationHTML += `<button class="btn btn-secondary" onclick="feedbackManager.loadFeedback(${page - 1})">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>`;
            }
            
            // Page info
            paginationHTML += `<span class="page-info">Page ${page} of ${pages} (${total} total)</span>`;
            
            // Next button
            if (page < pages) {
                paginationHTML += `<button class="btn btn-secondary" onclick="feedbackManager.loadFeedback(${page + 1})">
                    Next <i class="fas fa-chevron-right"></i>
                </button>`;
            }
            
            paginationHTML += '</div>';
            paginationEl.innerHTML = paginationHTML;
        }
        
        showLoading() {
            const feedbackList = document.getElementById('feedbackList');
            if (feedbackList) {
                feedbackList.innerHTML = '<div class="loading">Gathering eternal wisdom...</div>';
            }
        }
        
        showError(message) {
            const feedbackList = document.getElementById('feedbackList');
            if (feedbackList) {
                feedbackList.innerHTML = `<div class="error">${message}</div>`;
            }
        }
    }
})(); 