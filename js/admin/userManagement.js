// User Management JavaScript
// Handles user listing, search, filtering, and management actions

const UserManagement = {
    apiBaseUrl: null,
    currentPage: 1,
    itemsPerPage: 10,
    totalUsers: 0,
    allUsers: [],
    filteredUsers: [],
    currentFilter: 'all',

    init() {
        console.log('UserManagement.init() called');
        try {
            this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
            console.log('API Base URL set to:', this.apiBaseUrl);
            this.setupEventListeners();
            this.loadUsers();
            console.log('UserManagement initialization completed');
        } catch (error) {
            console.error('UserManagement initialization failed:', error);
        }
    },

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('userSearch');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchUsers(e.target.value);
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchUsers(searchInput.value);
            });
        }

        // Filter functionality
        const filterSelect = document.getElementById('filterStatus');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterUsers(e.target.value);
            });
        }

        // Modal close functionality
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }
    },

    async loadUsers() {
        try {
            console.log('UserManagement.loadUsers() called');
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No authentication token');

            const tbody = document.getElementById('usersTableBody');
            const mobileCards = document.getElementById('mobileUsersCards');
            
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="loading">Summoning souls...</td></tr>';
            }
            if (mobileCards) {
                mobileCards.innerHTML = '<div class="loading">Summoning souls...</div>';
            }

            console.log('Fetching users from:', `${this.apiBaseUrl}/users`);
            const response = await fetch(`${this.apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to load users: ${response.status} ${response.statusText}`);
            }

            const userData = await response.json();
            console.log('Raw API response:', userData);
            
            // Handle different response formats
            if (Array.isArray(userData)) {
                this.allUsers = userData;
            } else if (userData.data && Array.isArray(userData.data)) {
                this.allUsers = userData.data;
            } else if (userData.users && Array.isArray(userData.users)) {
                this.allUsers = userData.users;
            } else {
                console.warn('Unexpected API response format:', userData);
                this.allUsers = [];
            }
            
            console.log('UserManagement: Loaded', this.allUsers.length, 'users');
            this.filteredUsers = [...this.allUsers];
            this.totalUsers = this.allUsers.length;
            
            this.renderUsersTable();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users', error.message);
        }
    },

    searchUsers(query) {
        if (!query.trim()) {
            this.filteredUsers = [...this.allUsers];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredUsers = this.allUsers.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                (user.displayName && user.displayName.toLowerCase().includes(searchTerm))
            );
        }
        
        this.currentPage = 1;
        this.renderUsersTable();
        this.renderPagination();
    },

    filterUsers(filter) {
        this.currentFilter = filter;
        
        switch (filter) {
            case 'online':
                this.filteredUsers = this.allUsers.filter(user => user.online);
                break;
            case 'offline':
                this.filteredUsers = this.allUsers.filter(user => !user.online);
                break;
            case 'banned':
                this.filteredUsers = this.allUsers.filter(user => user.banned);
                break;
            default:
                this.filteredUsers = [...this.allUsers];
        }
        
        this.currentPage = 1;
        this.renderUsersTable();
        this.renderPagination();
    },

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        const mobileCards = document.getElementById('mobileUsersCards');
        
        if (this.filteredUsers.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="no-data">No souls found</td></tr>';
            }
            if (mobileCards) {
                mobileCards.innerHTML = '<div class="no-data">No souls found</div>';
            }
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageUsers = this.filteredUsers.slice(startIndex, endIndex);

        // Render desktop table
        if (tbody) {
            tbody.innerHTML = pageUsers.map(user => `
                <tr class="user-row" data-user-id="${user._id || user.id}">
                    <td>
                        <img src="${user.avatar || '../assets/images/default.jpg'}" 
                             alt="${user.username}" 
                             class="user-avatar"
                             style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    </td>
                    <td class="username">${user.username}</td>
                    <td class="display-name">${user.displayName || '-'}</td>
                    <td>
                        <span class="status-badge ${user.online ? 'online' : 'offline'}">
                            ${user.online ? 'Online' : 'Offline'}
                        </span>
                        ${user.banned ? '<span class="status-badge banned">Banned</span>' : ''}
                    </td>
                    <td class="join-date">${this.formatDate(user.createdAt)}</td>
                    <td class="last-active">${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</td>
                    <td class="actions">
                        <button class="action-btn view" onclick="console.log('View button clicked for user:', '${user._id || user.id}'); alert('Click registered! User: ${user.username}'); UserManagement.viewUser('${user._id || user.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="UserManagement.editUser('${user._id || user.id}')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${!user.banned ? 
                            `<button class="action-btn ban" onclick="UserManagement.banUser('${user._id || user.id}')" title="Ban User">
                                <i class="fas fa-ban"></i>
                            </button>` :
                            `<button class="action-btn unban" onclick="UserManagement.unbanUser('${user._id || user.id}')" title="Unban User">
                                <i class="fas fa-check"></i>
                            </button>`
                        }
                    </td>
                </tr>
            `).join('');
        }

        // Render mobile cards
        if (mobileCards) {
            mobileCards.innerHTML = pageUsers.map(user => `
                <div class="mobile-card" data-user-id="${user._id || user.id}">
                    <div class="mobile-card-header">
                        <img src="${user.avatar || '../assets/images/default.jpg'}" 
                             alt="${user.username}" 
                             class="mobile-card-avatar">
                        <div class="mobile-card-info">
                            <div class="mobile-card-username">${user.displayName || user.username}</div>
                            <div class="mobile-card-meta">@${user.username}</div>
                        </div>
                        <div class="status-badges">
                            <span class="status-badge ${user.online ? 'online' : 'offline'}">
                                ${user.online ? 'Online' : 'Offline'}
                            </span>
                            ${user.banned ? '<span class="status-badge banned">Banned</span>' : ''}
                        </div>
                    </div>
                    <div class="mobile-card-details">
                        <div class="mobile-card-field">
                            <span class="mobile-card-label">Joined</span>
                            <span class="mobile-card-value">${this.formatDate(user.createdAt)}</span>
                        </div>
                        <div class="mobile-card-field">
                            <span class="mobile-card-label">Last Active</span>
                            <span class="mobile-card-value">${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button class="action-btn view" onclick="UserManagement.viewUser('${user._id || user.id}')" title="View Details">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn edit" onclick="UserManagement.editUser('${user._id || user.id}')" title="Edit User">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${!user.banned ? 
                            `<button class="action-btn ban" onclick="UserManagement.banUser('${user._id || user.id}')" title="Ban User">
                                <i class="fas fa-ban"></i> Ban
                            </button>` :
                            `<button class="action-btn unban" onclick="UserManagement.unbanUser('${user._id || user.id}')" title="Unban User">
                                <i class="fas fa-check"></i> Unban
                            </button>`
                        }
                    </div>
                </div>
            `).join('');
        }
    },

    renderPagination() {
        const pagination = document.getElementById('usersPagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="UserManagement.changePage(${this.currentPage - 1})">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="page-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="page-btn" onclick="UserManagement.changePage(${i})">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="UserManagement.changePage(${this.currentPage + 1})">Next</button>`;
        }
        
        pagination.innerHTML = paginationHTML;
    },

    changePage(page) {
        this.currentPage = page;
        this.renderUsersTable();
        this.renderPagination();
    },

    viewUser(userId) {
        console.log('UserManagement.viewUser called with userId:', userId);
        let user = this.allUsers.find(u => u._id === userId);
        if (!user) {
            user = this.allUsers.find(u => u.id === userId);
        }
        if (!user) {
            console.error('User not found with ID:', userId);
            this.showError('User not found');
            return;
        }

        this.showModal('Soul Details', `
            <div class="user-details">
                <div class="user-header">
                    <img src="${user.avatar || '../assets/images/default.jpg'}" alt="${user.username}" class="modal-avatar">
                    <div class="user-info">
                        <h4>${user.displayName || user.username}</h4>
                        <p>@${user.username}</p>
                    </div>
                </div>
                <div class="user-stats">
                    <p><strong>Status:</strong> ${user.status || 'No status set'}</p>
                    <p><strong>Bio:</strong> ${user.bio || 'No bio provided'}</p>
                    <p><strong>Joined:</strong> ${this.formatDate(user.createdAt)}</p>
                    <p><strong>Last Login:</strong> ${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</p>
                    <p><strong>Online:</strong> ${user.online ? 'Yes' : 'No'}</p>
                    <p><strong>Banned:</strong> ${user.banned ? 'Yes' : 'No'}</p>
                </div>
            </div>
        `);
    },

    editUser(userId) {
        // Implementation for editing users would go here
        this.showModal('Edit Soul', '<p>User editing functionality coming soon...</p>');
    },

    async banUser(userId) {
        if (!confirm('Are you sure you want to ban this soul?')) return;
        
        try {
            const token = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ banned: true })
            });

            if (response.ok) {
                await this.loadUsers(); // Reload users
            } else {
                throw new Error('Failed to ban user');
            }
        } catch (error) {
            console.error('Error banning user:', error);
            this.showError('Failed to ban user', error.message);
        }
    },

    async unbanUser(userId) {
        if (!confirm('Are you sure you want to unban this soul?')) return;
        
        try {
            const token = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ banned: false })
            });

            if (response.ok) {
                await this.loadUsers(); // Reload users
            } else {
                throw new Error('Failed to unban user');
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            this.showError('Failed to unban user');
        }
    },

    showModal(title, content) {
        console.log('UserManagement.showModal called with:', title);
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = title;
            modalContent.innerHTML = content;
            modal.style.display = 'flex';
            modal.classList.add('active');
            console.log('Modal opened successfully');
        } else {
            console.error('Missing modal elements:', {
                modal: !!modal,
                modalTitle: !!modalTitle,
                modalContent: !!modalContent
            });
            this.showError('Modal elements not found');
        }
    },

    closeModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showError(message, details = '') {
        console.error('User Management Error:', message, details);
        
        // Use the dashboard notification system if available
        if (typeof AdminDashboard !== 'undefined' && AdminDashboard.showError) {
            AdminDashboard.showError(message, details);
        } else {
            // Fallback to alert
            alert(`Error: ${message}${details ? ` - ${details}` : ''}`);
        }
    },

    showSuccess(message) {
        // Use the dashboard notification system if available
        if (typeof AdminDashboard !== 'undefined' && AdminDashboard.showSuccess) {
            AdminDashboard.showSuccess(message);
        } else {
            // Fallback to alert
            alert(`Success: ${message}`);
        }
    }
};

// Make it globally available
window.UserManagement = UserManagement;

// Debug: Log when this script loads
console.log('UserManagement script loaded, object available:', typeof UserManagement);

// Remove auto-initialization - let AdminDashboard handle initialization
// This prevents race conditions and duplicate initialization
console.log('UserManagement module loaded and available for initialization');
