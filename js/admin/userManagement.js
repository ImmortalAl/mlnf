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
        try {
            console.log('UserManagement: Starting initialization...');
            this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
            console.log('UserManagement: API Base URL set to:', this.apiBaseUrl);
            this.setupEventListeners();
            console.log('UserManagement: Event listeners set up');
            this.loadUsers();
            console.log('UserManagement: Load users called');
        } catch (error) {
            console.error('UserManagement: Initialization failed:', error);
            this.showError('User Management initialization failed', error.message);
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

        // Close modal on backdrop click
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal && activeModal.id === 'userModal') {
                    this.closeModal();
                }
            }
        });

        // Cleanup online status button
        const cleanupBtn = document.getElementById('cleanupOnlineBtn');
        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', () => this.cleanupStaleOnlineUsers());
        }
    },

    async loadUsers() {
        try {
            console.log('UserManagement: Starting loadUsers...');
            const token = localStorage.getItem('sessionToken');
            console.log('UserManagement: Token exists:', !!token);
            if (!token) throw new Error('No authentication token');

            const tbody = document.getElementById('usersTableBody');
            const mobileCards = document.getElementById('mobileUsersCards');
            console.log('UserManagement: DOM elements found:', { tbody: !!tbody, mobileCards: !!mobileCards });
            
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="loading">Summoning souls...</td></tr>';
            }
            if (mobileCards) {
                mobileCards.innerHTML = '<div class="loading">Summoning souls...</div>';
            }

            console.log('UserManagement: Fetching from:', `${this.apiBaseUrl}/users`);
            const response = await fetch(`${this.apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('UserManagement: Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to load users: ${response.status} ${response.statusText}`);
            }

            const userData = await response.json();
            console.log('UserManagement: Raw user data received:', userData);
            
            // Handle different response formats
            if (Array.isArray(userData)) {
                this.allUsers = userData;
            } else if (userData.data && Array.isArray(userData.data)) {
                this.allUsers = userData.data;
            } else if (userData.users && Array.isArray(userData.users)) {
                this.allUsers = userData.users;
            } else {
                // Unexpected API response format
                console.warn('UserManagement: Unexpected response format, using empty array');
                this.allUsers = [];
            }
            
            console.log('UserManagement: Processed users count:', this.allUsers.length);
            this.filteredUsers = [...this.allUsers];
            this.totalUsers = this.allUsers.length;
            
            console.log('UserManagement: Calling renderUsersTable...');
            this.renderUsersTable();
            console.log('UserManagement: Calling renderPagination...');
            this.renderPagination();
            console.log('UserManagement: loadUsers completed successfully');

        } catch (error) {
            console.error('UserManagement: Error in loadUsers:', error);
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
                        <button class="action-btn view" onclick="UserManagement.viewUser('${user._id || user.id}')" title="View Details">
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
                        <button class="action-btn delete" onclick="UserManagement.deleteUser('${user._id || user.id}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
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
                        <button class="action-btn delete" onclick="UserManagement.deleteUser('${user._id || user.id}')" title="Delete User">
                            <i class="fas fa-trash"></i> Delete
                        </button>
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
        let user = this.allUsers.find(u => u._id === userId);
        if (!user) {
            user = this.allUsers.find(u => u.id === userId);
        }
        if (!user) {
            this.showError('User not found', `No user found with ID: ${userId}`);
            this.showError('User not found');
            return;
        }

        this.showModal('Soul Details', `
            <div class="user-details">
                <div class="user-header">
                    <img src="${user.avatar || '../assets/images/default.jpg'}" 
                         alt="${user.username}" 
                         class="modal-avatar"
                         style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent);">
                    <div class="user-info">
                        <h4 style="margin: 0; color: var(--accent);">${user.displayName || user.username}</h4>
                        <p style="margin: 0.5rem 0; color: var(--text-secondary);">@${user.username}</p>
                        <div class="status-badges" style="margin-top: 0.5rem;">
                            <span class="status-badge ${user.online ? 'online' : 'offline'}" style="margin-right: 0.5rem;">
                                ${user.online ? 'Online' : 'Offline'}
                            </span>
                            ${user.banned ? '<span class="status-badge banned">Banned</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="user-stats" style="margin-top: 1.5rem;">
                    <div class="stat-row" style="margin-bottom: 1rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(var(--accent-rgb), 0.2);">
                        <strong style="color: var(--accent);">Status:</strong> 
                        <span style="color: var(--text);">${user.status || 'No status set'}</span>
                    </div>
                    <div class="stat-row" style="margin-bottom: 1rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(var(--accent-rgb), 0.2);">
                        <strong style="color: var(--accent);">Bio:</strong> 
                        <span style="color: var(--text);">${user.bio || 'No bio provided'}</span>
                    </div>
                    <div class="stat-row" style="margin-bottom: 1rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(var(--accent-rgb), 0.2);">
                        <strong style="color: var(--accent);">Joined:</strong> 
                        <span style="color: var(--text);">${this.formatDate(user.createdAt)}</span>
                    </div>
                    <div class="stat-row" style="margin-bottom: 1rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(var(--accent-rgb), 0.2);">
                        <strong style="color: var(--accent);">Last Login:</strong> 
                        <span style="color: var(--text);">${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</span>
                    </div>
                    <div class="stat-row" style="margin-bottom: 1rem; padding: 0.5rem 0;">
                        <strong style="color: var(--accent);">User ID:</strong> 
                        <span style="color: var(--text-secondary); font-family: monospace; font-size: 0.9em;">${user._id || user.id}</span>
                    </div>
                </div>
                <div class="user-actions" style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                    ${!user.banned ? 
                        `<button class="btn btn-danger" onclick="UserManagement.banUser('${user._id || user.id}'); UserManagement.closeModal();" style="background: #dc267f; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; color: white;">
                            <i class="fas fa-ban"></i> Ban Soul
                        </button>` :
                        `<button class="btn btn-success" onclick="UserManagement.unbanUser('${user._id || user.id}'); UserManagement.closeModal();" style="background: #22c55e; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; color: white;">
                            <i class="fas fa-check"></i> Unban Soul
                        </button>`
                    }
                    <button class="btn btn-danger" onclick="UserManagement.deleteUser('${user._id || user.id}'); UserManagement.closeModal();" style="background: #ef4444; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; color: white;">
                        <i class="fas fa-trash"></i> Delete Soul
                    </button>
                    <button class="btn btn-secondary" onclick="UserManagement.closeModal();" style="background: rgba(var(--accent-rgb), 0.2); border: 1px solid var(--accent); padding: 0.5rem 1rem; border-radius: 0.25rem; color: var(--text);">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `);
    },

    editUser(userId) {
        let user = this.allUsers.find(u => u._id === userId);
        if (!user) {
            user = this.allUsers.find(u => u.id === userId);
        }
        if (!user) {
            this.showError('User not found', `No user found with ID: ${userId}`);
            this.showError('User not found');
            return;
        }

        this.showModal('Edit Soul', `
            <form id="editUserForm" class="edit-user-form">
                <div class="user-edit-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(var(--accent-rgb), 0.2);">
                    <img src="${user.avatar || '../assets/images/default.jpg'}" 
                         alt="${user.username}" 
                         style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent);">
                    <div>
                        <h4 style="margin: 0; color: var(--accent);">Editing: ${user.username}</h4>
                        <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.9em;">User ID: ${user._id || user.id}</p>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="editDisplayName" style="display: block; margin-bottom: 0.5rem; color: var(--accent); font-weight: 500;">Display Name</label>
                    <input type="text" id="editDisplayName" name="displayName" 
                           value="${user.displayName || ''}" 
                           placeholder="Soul's display name"
                           style="width: 100%; padding: 0.75rem; border: 1px solid rgba(var(--accent-rgb), 0.3); border-radius: 0.25rem; background: rgba(26, 26, 51, 0.8); color: var(--text); font-size: 1rem;">
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="editStatus" style="display: block; margin-bottom: 0.5rem; color: var(--accent); font-weight: 500;">Status Message</label>
                    <input type="text" id="editStatus" name="status" 
                           value="${user.status || ''}" 
                           placeholder="Soul's status message"
                           style="width: 100%; padding: 0.75rem; border: 1px solid rgba(var(--accent-rgb), 0.3); border-radius: 0.25rem; background: rgba(26, 26, 51, 0.8); color: var(--text); font-size: 1rem;">
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="editBio" style="display: block; margin-bottom: 0.5rem; color: var(--accent); font-weight: 500;">Biography</label>
                    <textarea id="editBio" name="bio" 
                              placeholder="Soul's biography"
                              style="width: 100%; padding: 0.75rem; border: 1px solid rgba(var(--accent-rgb), 0.3); border-radius: 0.25rem; background: rgba(26, 26, 51, 0.8); color: var(--text); font-size: 1rem; min-height: 100px; resize: vertical;">${user.bio || ''}</textarea>
                </div>


                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text);">
                        <input type="checkbox" id="editBanned" name="banned" ${user.banned ? 'checked' : ''}
                               style="width: 1.2rem; height: 1.2rem; accent-color: var(--accent);">
                        <span style="font-weight: 500;">Soul is banned from the sanctuary</span>
                    </label>
                </div>

                <div class="modal-actions" style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(var(--accent-rgb), 0.2);">
                    <button type="button" onclick="UserManagement.closeModal();" 
                            style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(var(--accent-rgb), 0.3); padding: 0.75rem 1.5rem; border-radius: 0.25rem; color: var(--text); cursor: pointer; transition: var(--transition);">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" 
                            style="background: var(--accent); border: none; padding: 0.75rem 1.5rem; border-radius: 0.25rem; color: var(--primary); cursor: pointer; font-weight: 500; transition: var(--transition);">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        `);

        // Add form submit handler
        const form = document.getElementById('editUserForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUser(userId, form);
            });
        }
    },

    async updateUser(userId, form) {
        try {
            const formData = new FormData(form);
            const updateData = {
                displayName: formData.get('displayName'),
                status: formData.get('status'),
                bio: formData.get('bio'),
                banned: formData.has('banned')
            };

            // Remove empty values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === '' || updateData[key] === null) {
                    delete updateData[key];
                }
            });

            const token = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            this.showSuccess('Soul updated successfully');
            this.closeModal();
            await this.loadUsers(); // Reload users to show changes

        } catch (error) {
            // Error updating user
            this.showError('Failed to update soul', error.message);
        }
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
            // Error banning user
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
            // Error unbanning user
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
            modal.style.display = 'flex';
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            
            // Focus management for accessibility
            const firstInput = modalContent.querySelector('input, button, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        } else {
            this.showError('Missing modal elements', JSON.stringify({
                modal: !!modal,
                modalTitle: !!modalTitle,
                modalContent: !!modalContent
            }));
            this.showError('Modal system is not properly initialized');
        }
    },

    closeModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
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

            if (!response.ok) {
                let errorMessage = 'Failed to ban user';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            this.showSuccess('User banned successfully');
            await this.loadUsers();
        } catch (error) {
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

            if (!response.ok) {
                let errorMessage = 'Failed to unban user';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            this.showSuccess('User unbanned successfully');
            await this.loadUsers();
        } catch (error) {
            this.showError('Failed to unban user', error.message);
        }
    },

    async deleteUser(userId) {
        const user = this.allUsers.find(u => (u._id || u.id) === userId);
        if (!user) {
            this.showError('User not found');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete user';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (parseError) {
                    try {
                        errorMessage = await response.text() || errorMessage;
                    } catch (textError) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                throw new Error(errorMessage);
            }

            // Remove from local array
            this.allUsers = this.allUsers.filter(u => (u._id || u.id) !== userId);
            this.filteredUsers = this.filteredUsers.filter(u => (u._id || u.id) !== userId);
            
            // Re-render the table
            this.renderUsersTable();
            this.renderPagination();
            
            this.showSuccess(`User ${user.username} has been deleted successfully.`);
        } catch (error) {
            this.showError('Failed to delete user', error.message);
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
    },

    async cleanupStaleOnlineUsers() {
        if (!confirm('This will set offline all users who have been marked online for more than 30 days. Continue?')) {
            return;
        }

        const cleanupBtn = document.getElementById('cleanupOnlineBtn');
        const originalText = cleanupBtn.innerHTML;
        
        try {
            cleanupBtn.disabled = true;
            cleanupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cleaning...';

            const token = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBaseUrl}/users/cleanup-online-status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Cleanup failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.cleaned > 0) {
                this.showSuccess(`Successfully cleaned up ${result.cleaned} stale online users`);
                console.log('Cleaned up users:', result.details);
                // Reload the users table to show updated online statuses
                await this.loadUsers();
            } else {
                this.showSuccess('No stale online users found to clean up');
            }

        } catch (error) {
            console.error('Cleanup error:', error);
            this.showError('Failed to cleanup stale online users', error.message);
        } finally {
            cleanupBtn.disabled = false;
            cleanupBtn.innerHTML = originalText;
        }
    }
};

// Make it globally available
window.UserManagement = UserManagement;

// Remove auto-initialization - let AdminDashboard handle initialization
// This prevents race conditions and duplicate initialization
