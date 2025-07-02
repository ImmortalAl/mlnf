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
    
    // Check admin authorization
    async function checkAdminAuth() {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            window.location.href = '/';
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
            window.location.href = '/';
            return false;
        }
    }
    
    // Navigation - Delegated to AdminDashboard module
    function setupNavigation() {
        // Navigation is now handled by AdminDashboard.setupAdminNavigation()
        // This function is kept for compatibility but delegates to the main module
        console.log('Legacy navigation setup - delegating to AdminDashboard');
    }
    
    function showSection(sectionId) {
        // Delegate to AdminDashboard.switchSection for consistent behavior
        if (typeof AdminDashboard !== 'undefined' && AdminDashboard.switchSection) {
            AdminDashboard.switchSection(sectionId);
        } else {
            console.warn('AdminDashboard not available, using fallback section switching');
            // Fallback implementation
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                currentSection = sectionId;
            }
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
                user.username.toLowerCase().includes(searchTerm) ||
                (user.displayName && user.displayName.toLowerCase().includes(searchTerm))
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
            </div>
        `;
        
        modal.style.display = 'flex';
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
                <button id="saveUserBtn">Save</button>
            </div>
            <div id="editUserFeedback"></div>
        `;
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.getElementById('saveUserBtn').onclick = async function() {
            const displayName = document.getElementById('editDisplayName').value;
            const status = document.getElementById('editStatus').value;
            const bio = document.getElementById('editBio').value;
            const token = localStorage.getItem('sessionToken');
            try {
                const res = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/${username}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ displayName, status, bio })
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
            window.location.href = '/';
        });
        
        // Search
        document.getElementById('userSearch').addEventListener('input', displayUsers);
        document.getElementById('filterStatus').addEventListener('change', displayUsers);
        
        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            const modal = document.getElementById('userModal');
            modal.classList.remove('active');
            modal.style.display = 'none';
        });

        // Message Modal Listeners - Only set up if messageModal.js component is not available
        if (!window.MLNF || !window.MLNF.initMessageModal) {
            const messageModal = document.getElementById('messageModal');
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            const closeMessageModalBtn = document.getElementById('closeMessageModal');
            const messageInput = document.getElementById('messageInput');

            if (messageModal && sendMessageBtn && closeMessageModalBtn && messageInput) {
                closeMessageModalBtn.addEventListener('click', () => {
                    messageModal.classList.remove('active');
                    messageModal.setAttribute('aria-hidden', 'true');
                });

                sendMessageBtn.addEventListener('click', async () => {
                    const messageContent = messageInput.value.trim();
                    const recipientUsername = document.getElementById('recipientName').dataset.username; // Assuming you'll store username in a data attribute
                    const token = localStorage.getItem('sessionToken');

                    if (!messageContent || !recipientUsername) {
                        alert('Message content and recipient are required.');
                        return;
                    }

                    try {
                        const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/reply`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                recipient: recipientUsername, // Or recipientId if your backend expects that
                                content: messageContent,
                                // Add originalMessageId if needed for threading, get it from where you store it when opening modal
                            })
                        });

                        if (response.ok) {
                            alert('Message sent successfully!');
                            messageInput.value = ''; // Clear input
                            messageModal.classList.remove('active');
                            messageModal.setAttribute('aria-hidden', 'true');
                            // Optionally, refresh feedback or messages list
                        } else {
                            const errorData = await response.json();
                            alert(`Failed to send message: ${errorData.message || response.statusText}`);
                        }
                    } catch (error) {
                        console.error('Error sending message:', error);
                        alert('An error occurred while sending the message.');
                    }
                });
            } else {
                console.warn('Message modal elements not found. Full interactivity might be limited.');
            }
        } else {
        }
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
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // --- Eternal Feedback Logic ---
    async function loadFeedback() {
        const token = localStorage.getItem('sessionToken');
        const tbody = document.getElementById('feedbackTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Summoning immortal feedback...</td></tr>';
        try {
            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/feedback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch feedback');
            const feedback = await response.json();
            if (!Array.isArray(feedback) || feedback.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No feedback received yet. The silence of eternity...</td></tr>';
                return;
            }
            tbody.innerHTML = '';
            feedback.forEach(item => {
                const date = new Date(item.timestamp).toLocaleString();
                const content = item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const sender = item.anonymous ? '<span class="anonymous">Anonymous Soul</span>' : (item.sender?.displayName || item.sender?.username || 'Unknown');
                const replyBtn = item.anonymous ? '<span class="muted">(N/A)</span>' : `<button class="btn btn-primary btn-reply" data-uid="${item.sender?._id}" data-username="${item.sender?.username}"><i class="fas fa-reply"></i> Reply</button>`;
                const deleteBtn = `<button class="btn btn-outline btn-delete" data-id="${item._id}"><i class="fas fa-trash"></i></button>`;
                tbody.innerHTML += `<tr>
                    <td>${date}</td>
                    <td>${content}</td>
                    <td>${sender}</td>
                    <td>${replyBtn}</td>
                    <td>${deleteBtn}</td>
                </tr>`;
            });
            // Attach event listeners for reply and delete
            tbody.querySelectorAll('.btn-reply').forEach(btn => {
                btn.addEventListener('click', function() {
                    const username = btn.getAttribute('data-username');
                    const userId = btn.getAttribute('data-uid'); // Assuming you have user ID available
                    
                    // Store recipient info for sending message
                    const recipientNameElement = document.getElementById('recipientName');
                    if (recipientNameElement) {
                        recipientNameElement.textContent = `To: ${username}`;
                        recipientNameElement.dataset.username = username; // Store for sending
                        recipientNameElement.dataset.userId = userId; // Store for sending if API needs ID
                    }
                    
                    if (window.openMessageModal) {
                        // Pass the actual user ID if available and needed by openMessageModal
                        // For now, it seems openMessageModal in scripts.js might just take username or nothing
                        window.openMessageModal(username, userId); 
                    } else {
                        alert('Messaging system not available. Ensure shared components and scripts.js are loaded.');
                    }
                });
            });
            tbody.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async function() {
                    if (!confirm('Delete this feedback forever?')) return;
                    const id = btn.getAttribute('data-id');
                    const delRes = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/feedback/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (delRes.ok) {
                        btn.closest('tr').remove();
                    } else {
                        alert('Failed to delete feedback.');
                    }
                });
            });
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" class="error">Failed to load feedback: ${error.message}</td></tr>`;
        }
    }
})(); 