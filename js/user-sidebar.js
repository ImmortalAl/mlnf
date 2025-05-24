class UserSidebar {
    constructor(users = []) {
        console.log('UserSidebar constructor called');
        
        // Initialize elements
        this.initializeElements();
        
        // Add event listeners
        this.initializeEventListeners();
        
        // Display users (either from API or mock data)
        this.displayUsers(users);
    }

    initializeElements() {
        // Wait for elements to be ready
        const checkElements = () => {
            this.activeUsers = document.querySelector('.active-users');
            this.showUsersBtn = document.querySelector('.show-users-btn');
            this.closeUsersBtn = document.querySelector('.close-sidebar');
            this.userList = document.querySelector('#userList');
            
            // Check if all required elements are found
            const elementsReady = this.activeUsers && this.showUsersBtn && this.closeUsersBtn && this.userList;
            
            if (elementsReady) {
                console.log('All elements found');
                return true;
            } else {
                console.log('Waiting for elements:', {
                    activeUsers: !!this.activeUsers,
                    showUsersBtn: !!this.showUsersBtn,
                    closeUsersBtn: !!this.closeUsersBtn,
                    userList: !!this.userList
                });
                return false;
            }
        };

        // Check elements immediately
        if (!checkElements()) {
            // If not ready, wait for them
            const interval = setInterval(() => {
                if (checkElements()) {
                    clearInterval(interval);
                    // Initialize event listeners after elements are found
                    this.initializeEventListeners();
                    return;
                }
            }, 100);
        }
    }

    initializeEventListeners() {
        // Only add event listeners if elements exist
        if (this.showUsersBtn) {
            this.showUsersBtn.addEventListener('click', () => this.toggleSidebar());
        }

        if (this.closeUsersBtn) {
            this.closeUsersBtn.addEventListener('click', () => this.toggleSidebar());
        }
    }

    toggleSidebar() {
        if (!this.activeUsers) {
            console.error('Active users element not found');
            return;
        }

        this.activeUsers.classList.toggle('active');
    }

    async fetchAndDisplayUsers() {
        try {
            const response = await fetch(`${MLNF_CONFIG.API_BASE_URL}/users/active`);
            const users = await response.json();
            
            if (this.userList) {
                this.displayUsers(users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            if (this.userList) {
                this.userList.innerHTML = '<p class="error">Failed to load active users</p>';
            }
        }
    }

    displayUsers(users) {
        if (this.userList) {
            this.userList.innerHTML = this.generateUserListHTML(users);
        }
    }

    generateUserListHTML(users) {
        return users.map(user => `
            <div class="profile-preview">
                <img src="${user.avatarUrl}" alt="${user.username}'s avatar">
                <div>
                    <a href="profiles.html#${user.username}">${user.username}</a>
                    ${user.isOnline ? '<span class="online-dot"></span>' : ''}
                    <p class="status">${user.status || 'Eternal Seeker'}</p>
                </div>
            </div>
        `).join('');
    }

    static initialize(users = []) {
        console.log('Attempting to initialize UserSidebar');
        
        // Initialize immediately if elements exist
        const activeUsers = document.querySelector('.active-users');
        const showUsersBtn = document.querySelector('.show-users-btn');
        
        if (activeUsers && showUsersBtn) {
            console.log('Elements found, initializing');
            new UserSidebar(users);
        } else {
            console.log('Elements not found, waiting for them to be loaded');
            
            // Use MutationObserver to wait for elements
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.classList.contains('active-users') || 
                                node.classList.contains('show-users-btn')) {
                                console.log('Found required element:', node);
                                observer.disconnect();
                                new UserSidebar(users);
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
}

// Initialize the sidebar when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded event fired');
    // Try to fetch real data first, fall back to mock data if needed
    UserSidebar.initialize();
});
