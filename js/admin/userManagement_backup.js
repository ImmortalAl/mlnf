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
        console.log('Initializing User Management...');
        this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
        this.setupEventListeners();
        this.loadUsers();
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
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No authentication token');

            const tbody = document.getElementById('usersTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="loading">Summoning souls...</td></tr>';
            }

            const response = await fetch(`${this.apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            this.allUsers = await response.json();
            this.filteredUsers = [...this.allUsers];
            this.totalUsers = this.allUsers.length;
            
            this.renderUsersTable();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
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
        if (!tbody) return;

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No souls found</td></tr>';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageUsers = this.filteredUsers.slice(startIndex, endIndex);

        tbody.innerHTML = pageUsers.map(user => `
            <tr class="user-row" data-user-id="${user._id}">
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
                    <button class="action-btn view" onclick="UserManagement.viewUser('${user._id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="UserManagement.editUser('${user._id}')" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${!user.banned ? 
                        `<button class="action-btn ban" onclick="UserManagement.banUser('${user._id}')" title="Ban User">
                            <i class="fas fa-ban"></i>
                        </button>` :
                        `<button class="action-btn unban" onclick="UserManagement.unbanUser('${user._id}')" title="Unban User">
                            <i class="fas fa-check"></i>
                        </button>`
                    }
                </td>
            </tr>
        `).join('');
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
        const user = this.allUsers.find(u => u._id === userId);
        if (!user) return;

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
        console.log('Edit user:', userId);
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
                console.log('User banned successfully');
            } else {
                throw new Error('Failed to ban user');
            }
        } catch (error) {
            console.error('Error banning user:', error);
            this.showError('Failed to ban user');
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
                console.log('User unbanned successfully');
            } else {
                throw new Error('Failed to unban user');
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            this.showError('Failed to unban user');
        }
    },

    showModal(title, content) {
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = title;
            modalContent.innerHTML = content;
            modal.style.display = 'block';
        }
    },

    closeModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
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

    showError(message) {
        console.error('User Management Error:', message);
        // Could show a toast notification or error banner
    }
};

// Make it globally available
window.UserManagement = UserManagement;
