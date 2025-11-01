/**
 * MLNF - Much Love, No Fear
 * Main Frontend JavaScript
 * Handles: Authentication, Socket.io, API calls, UI interactions
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : 'https://much-love-no-fear.onrender.com/api',
    SOCKET_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : 'https://much-love-no-fear.onrender.com',
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    BREADCRUMB_MAX: 5
};

// ============================================
// STATE MANAGEMENT
// ============================================
const State = {
    user: null,
    token: null,
    socket: null,
    onlineUsers: [],
    notifications: [],
    runegoldBalance: 0,
    breadcrumbs: []
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = {
    // Format date
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return d.toLocaleDateString();
    },

    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // Format duration (seconds to MM:SS)
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--info)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Show loading spinner
    showLoading(element, show = true) {
        if (show) {
            element.innerHTML = '<div class="loading-spinner" style="margin: 2rem auto;"></div>';
        }
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Get initials from username
    getInitials(username) {
        return username.substring(0, 2).toUpperCase();
    },

    // Generate random avatar color
    getAvatarColor(username) {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
        ];
        const index = username.charCodeAt(0) % colors.length;
        return colors[index];
    }
};

// ============================================
// API SERVICE
// ============================================
const API = {
    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (State.token) {
            headers['Authorization'] = `Bearer ${State.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        async register(userData) {
            return await API.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        async login(credentials) {
            return await API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
        },

        async getProfile() {
            return await API.request('/auth/me');
        },

        async updateProfile(updates) {
            return await API.request('/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
        },

        async getRecoveryQuestion(username) {
            return await API.request('/auth/recovery/question', {
                method: 'POST',
                body: JSON.stringify({ username })
            });
        },

        async resetPassword(data) {
            return await API.request('/auth/recovery/reset', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async changePassword(data) {
            return await API.request('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async follow(userId) {
            return await API.request(`/auth/follow/${userId}`, {
                method: 'POST'
            });
        },

        async getNotifications() {
            return await API.request('/auth/notifications');
        },

        async markNotificationRead(notificationId) {
            return await API.request(`/auth/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });
        }
    },

    // Video endpoints
    videos: {
        async getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await API.request(`/videos?${queryString}`);
        },

        async getById(videoId) {
            return await API.request(`/videos/${videoId}`);
        },

        async upload(formData) {
            return await fetch(`${CONFIG.API_URL}/videos/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${State.token}`
                },
                body: formData
            }).then(res => res.json());
        },

        async vote(videoId, voteType) {
            return await API.request(`/videos/${videoId}/vote`, {
                method: 'POST',
                body: JSON.stringify({ voteType })
            });
        },

        async addComment(videoId, content, timestamp = null) {
            return await API.request(`/videos/${videoId}/comment`, {
                method: 'POST',
                body: JSON.stringify({ content, timestamp })
            });
        },

        async reply(videoId, commentId, content) {
            return await API.request(`/videos/${videoId}/comment/${commentId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ content })
            });
        },

        async report(videoId, reason, details = '') {
            return await API.request(`/videos/${videoId}/report`, {
                method: 'POST',
                body: JSON.stringify({ reason, details })
            });
        },

        async delete(videoId) {
            return await API.request(`/videos/${videoId}`, {
                method: 'DELETE'
            });
        },

        async getTrending() {
            return await API.request('/videos/trending/now');
        },

        async getUserVideos(userId, page = 1) {
            return await API.request(`/videos/user/${userId}?page=${page}`);
        }
    },

    // Runegold endpoints
    runegold: {
        async getBalance() {
            return await API.request('/runegold/balance');
        },

        async getJourney(page = 1) {
            return await API.request(`/runegold/journey?page=${page}`);
        },

        async purchaseStripe(packageName) {
            return await API.request('/runegold/purchase/stripe', {
                method: 'POST',
                body: JSON.stringify({ package: packageName })
            });
        },

        async confirmStripe(paymentIntentId) {
            return await API.request('/runegold/purchase/stripe/confirm', {
                method: 'POST',
                body: JSON.stringify({ paymentIntentId })
            });
        },

        async purchasePayPal(packageName) {
            return await API.request('/runegold/purchase/paypal', {
                method: 'POST',
                body: JSON.stringify({ package: packageName })
            });
        },

        async executePayPal(paymentId, payerId) {
            return await API.request('/runegold/purchase/paypal/execute', {
                method: 'POST',
                body: JSON.stringify({ paymentId, payerId })
            });
        },

        async boostVideo(videoId) {
            return await API.request(`/runegold/spend/boost/${videoId}`, {
                method: 'POST'
            });
        },

        async highlightComment(videoId, commentId) {
            return await API.request(`/runegold/spend/highlight/${videoId}/${commentId}`, {
                method: 'POST'
            });
        },

        async purchaseBadge(badgeName, badgeIcon, badgeDescription = '') {
            return await API.request('/runegold/spend/badge', {
                method: 'POST',
                body: JSON.stringify({ badgeName, badgeIcon, badgeDescription })
            });
        },

        async tipUser(userId, amount, message = '') {
            return await API.request(`/runegold/spend/tip/${userId}`, {
                method: 'POST',
                body: JSON.stringify({ amount, message })
            });
        },

        async getLeaderboard(limit = 10) {
            return await API.request(`/runegold/leaderboard?limit=${limit}`);
        }
    },

    // Donation endpoints
    donations: {
        async stripePayment(amount, name = '', email = '', message = '') {
            return await API.request('/donations/stripe', {
                method: 'POST',
                body: JSON.stringify({ amount, name, email, message })
            });
        },

        async confirmStripe(paymentIntentId) {
            return await API.request('/donations/stripe/confirm', {
                method: 'POST',
                body: JSON.stringify({ paymentIntentId })
            });
        },

        async paypalPayment(amount, name = '', email = '', message = '') {
            return await API.request('/donations/paypal', {
                method: 'POST',
                body: JSON.stringify({ amount, name, email, message })
            });
        },

        async executePayPal(paymentId, payerId) {
            return await API.request('/donations/paypal/execute', {
                method: 'POST',
                body: JSON.stringify({ paymentId, payerId })
            });
        },

        async getEthAddress() {
            return await API.request('/donations/ethereum/address');
        },

        async verifyEthTransaction(txHash, name = '', message = '') {
            return await API.request('/donations/ethereum/verify', {
                method: 'POST',
                body: JSON.stringify({ txHash, name, message })
            });
        }
    },

    // Blockonomics endpoints
    blockonomics: {
        async generateAddress(amount, purpose = 'donation', name = '', message = '') {
            return await API.request('/blockonomics/generate-address', {
                method: 'POST',
                body: JSON.stringify({ amount, name, message, purpose })
            });
        },

        async checkPayment(address) {
            return await API.request(`/blockonomics/check-payment/${address}`);
        },

        async getPrice() {
            return await API.request('/blockonomics/price');
        },

        async convertUSDtoBTC(amount) {
            return await API.request(`/blockonomics/convert?amount=${amount}`);
        }
    },
    
    // Messages API
    messages: {
        async getConversation(userId, limit = 50, skip = 0) {
            return await API.request(`/messages/conversation/${userId}?limit=${limit}&skip=${skip}`);
        },
        
        async getConversations(limit = 20) {
            return await API.request(`/messages/conversations?limit=${limit}`);
        },
        
        async sendMessage(recipientId, message) {
            return await API.request('/messages/send', {
                method: 'POST',
                body: JSON.stringify({ recipientId, message })
            });
        },
        
        async markAsRead(userId) {
            return await API.request(`/messages/mark-read/${userId}`, {
                method: 'POST'
            });
        },
        
        async getUnreadCount() {
            return await API.request('/messages/unread-count');
        },
        
        async deleteMessage(messageId) {
            return await API.request(`/messages/${messageId}`, {
                method: 'DELETE'
            });
        },
        
        async searchMessages(query, limit = 50) {
            return await API.request(`/messages/search?query=${encodeURIComponent(query)}&limit=${limit}`);
        }
    }
};

// ============================================
// AUTHENTICATION
// ============================================
const Auth = {
    // Initialize authentication state
    init() {
        const token = localStorage.getItem('mlnf_token');
        const user = localStorage.getItem('mlnf_user');

        if (token && user) {
            State.token = token;
            State.user = JSON.parse(user);
            this.updateUI();
            
            // Load user profile in background
            this.refreshProfile();
        }
    },

    // Update UI based on auth state
    updateUI() {
        const authLink = document.getElementById('authLink');
        const dashboardLink = document.getElementById('dashboardLink');
        const notificationBell = document.getElementById('notificationBell');

        if (State.user) {
            if (authLink) {
                authLink.textContent = 'Logout';
                authLink.href = '#';
                authLink.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            }
            
            if (dashboardLink) dashboardLink.classList.remove('hidden');
            if (notificationBell) notificationBell.classList.remove('hidden');

            // Update Runegold display
            this.updateRunegoldDisplay();

            // Connect Socket.io
            Socket.connect();
        } else {
            if (authLink) {
                authLink.textContent = 'Login';
                // Detect if we're in a subdirectory
                const isInSubdir = window.location.pathname.includes('/pages/');
                authLink.href = isInSubdir ? 'auth.html' : 'pages/auth.html';
                authLink.onclick = null;
            }
            
            if (dashboardLink) dashboardLink.classList.add('hidden');
            if (notificationBell) notificationBell.classList.add('hidden');
        }
    },

    // Refresh user profile
    async refreshProfile() {
        try {
            const data = await API.auth.getProfile();
            State.user = data.user;
            State.runegoldBalance = data.user.runegoldBalance;
            localStorage.setItem('mlnf_user', JSON.stringify(data.user));
            this.updateRunegoldDisplay();
        } catch (error) {
            console.error('Failed to refresh profile:', error);
            
            // If authentication fails, clear stored credentials
            if (error.message && error.message.includes('authenticate')) {
                console.log('Token expired or invalid, clearing session');
                this.logout();
            }
        }
    },

    // Update Runegold display
    updateRunegoldDisplay() {
        const runegoldAmount = document.getElementById('runegoldAmount');
        if (runegoldAmount && State.user) {
            runegoldAmount.textContent = Utils.formatNumber(State.user.runegoldBalance || 0);
        }
    },

    // Login
    async login(username, password) {
        try {
            const data = await API.auth.login({ username, password });
            
            State.token = data.token;
            State.user = data.user;
            State.runegoldBalance = data.user.runegoldBalance;
            
            localStorage.setItem('mlnf_token', data.token);
            localStorage.setItem('mlnf_user', JSON.stringify(data.user));
            
            this.updateUI();
            Utils.showToast('Login successful!', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
            
            return data;
        } catch (error) {
            Utils.showToast(error.message || 'Login failed', 'error');
            throw error;
        }
    },

    // Register
    async register(userData) {
        try {
            const data = await API.auth.register(userData);
            
            State.token = data.token;
            State.user = data.user;
            State.runegoldBalance = data.user.runegoldBalance;
            
            localStorage.setItem('mlnf_token', data.token);
            localStorage.setItem('mlnf_user', JSON.stringify(data.user));
            
            this.updateUI();
            Utils.showToast('Registration successful!', 'success');
            
            // Redirect to profile setup
            setTimeout(() => {
                window.location.href = '/pages/profile-setup.html';
            }, 1000);
            
            return data;
        } catch (error) {
            Utils.showToast(error.message || 'Registration failed', 'error');
            throw error;
        }
    },

    // Logout
    logout() {
        localStorage.removeItem('mlnf_token');
        localStorage.removeItem('mlnf_user');
        
        State.token = null;
        State.user = null;
        State.runegoldBalance = 0;
        
        if (State.socket) {
            State.socket.disconnect();
            State.socket = null;
        }
        
        Utils.showToast('Logged out successfully', 'info');
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 500);
    }
};


// ============================================
// SOCKET.IO REAL-TIME COMMUNICATION
// ============================================
const Socket = {
    // Connect to Socket.io server
    connect() {
        if (!State.user || State.socket) return;

        try {
            State.socket = io(CONFIG.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            State.socket.on('connect', () => {
                console.log('Socket.io connected');
                
                // Authenticate with server
                State.socket.emit('authenticate', {
                    userId: State.user.id || State.user._id,
                    username: State.user.username
                });
            });

            State.socket.on('disconnect', () => {
                console.log('Socket.io disconnected');
            });

            // Listen for online users updates
            State.socket.on('onlineUsers', (users) => {
                State.onlineUsers = users;
                this.updateOnlineUsersList();
            });

            // Listen for private messages
            State.socket.on('privateMessage', (data) => {
                this.handlePrivateMessage(data);
            });

            // Listen for vote updates
            State.socket.on('voteUpdate', (data) => {
                this.handleVoteUpdate(data);
            });

            // Listen for comment updates
            State.socket.on('commentAdded', (data) => {
                this.handleCommentAdded(data);
            });

            // Listen for Runegold updates
            State.socket.on('runegoldUpdate', (data) => {
                if (data.userId === (State.user.id || State.user._id)) {
                    State.user.runegoldBalance = data.newBalance;
                    Auth.updateRunegoldDisplay();
                    Utils.showToast(`Runegold ${data.type}: ${data.amount}`, 'success');
                }
            });

            // Listen for notifications
            State.socket.on('notification', (notification) => {
                this.handleNotification(notification);
            });

            // Listen for typing status
            State.socket.on('typingStatus', (data) => {
                this.handleTypingStatus(data);
            });

        } catch (error) {
            console.error('Socket.io connection error:', error);
        }
    },

    // Update online users list in sidebar
    updateOnlineUsersList() {
        const list = document.getElementById('onlineUsersList');
        const count = document.getElementById('onlineCount');
        
        if (!list) return;

        if (count) count.textContent = `(${State.onlineUsers.length})`;

        if (State.onlineUsers.length === 0) {
            list.innerHTML = `
                <li class="text-center text-muted" style="padding: 2rem 0;">
                    <i class="fas fa-user-slash" style="font-size: 2rem; opacity: 0.3;"></i>
                    <p style="margin-top: 1rem; font-size: 0.875rem;">No users online</p>
                </li>
            `;
            return;
        }

        list.innerHTML = State.onlineUsers.map(user => `
            <li class="online-user-item" onclick="Messaging.openChat('${user.userId}', '${user.username}')">
                <div class="user-avatar" style="background: ${Utils.getAvatarColor(user.username)}">
                    ${Utils.getInitials(user.username)}
                    <span class="online-status"></span>
                </div>
                <span>${user.username}</span>
            </li>
        `).join('');
    },

    // Handle private message
    handlePrivateMessage(data) {
        // Show notification or update active chat
        const fromUsername = data.fromUsername || data.from;
        Utils.showToast(`New message from ${fromUsername}`, 'info');
        
        // If messaging modal is open and from current chat user, update it
        const modal = document.getElementById('messagingModal');
        if (modal && modal.classList.contains('active') && 
            Messaging.currentChat && Messaging.currentChat.userId === data.from) {
            Messaging.addMessageToChat(data, 'received');
        }
    },

    // Handle vote update
    handleVoteUpdate(data) {
        const upvoteCount = document.getElementById(`upvotes-${data.videoId}`);
        const downvoteCount = document.getElementById(`downvotes-${data.videoId}`);
        const netScore = document.getElementById(`net-score-${data.videoId}`);

        if (upvoteCount) upvoteCount.textContent = data.upvotes;
        if (downvoteCount) downvoteCount.textContent = data.downvotes;
        if (netScore) netScore.textContent = data.netScore;
    },

    // Handle comment added
    handleCommentAdded(data) {
        const commentsSection = document.getElementById('comments-list');
        if (commentsSection) {
            // Reload comments or add new comment to DOM
            const commentHTML = UI.renderComment(data.comment);
            commentsSection.insertAdjacentHTML('beforeend', commentHTML);
        }
    },

    // Handle notification
    handleNotification(notification) {
        State.notifications.unshift(notification);
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const unreadCount = State.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.classList.toggle('hidden', unreadCount === 0);
        }

        // Show toast
        Utils.showToast(notification.message, 'info');
        
        // Play sound if enabled
        if (State.user?.preferences?.notificationSound) {
            this.playNotificationSound();
        }
    },

    // Handle typing status
    handleTypingStatus(data) {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            if (data.isTyping) {
                typingIndicator.textContent = `${data.from} is typing...`;
                typingIndicator.classList.remove('hidden');
            } else {
                typingIndicator.classList.add('hidden');
            }
        }
    },

    // Play notification sound
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijgIF2ez7OmgUxELTKXh8LdiHgU2jdXwyH0pBSh+zPLaizsIFGS57OukVhQLSpzf8bt0IwYufdDx3I4+CRdpterk');
        audio.play().catch(() => {});
    },

    // Send private message
    sendMessage(to, message) {
        if (!State.socket) return;
        
        State.socket.emit('privateMessage', {
            to,
            from: State.user.id || State.user._id,
            message,
            timestamp: new Date()
        });
    },

    // Send typing indicator
    sendTyping(to, isTyping) {
        if (!State.socket) return;
        
        State.socket.emit('typing', {
            to,
            from: State.user.id || State.user._id,
            isTyping
        });
    }
};

// ============================================
// MESSAGING SYSTEM
// ============================================
const Messaging = {
    currentChat: null,

    // Open chat modal
    openChat(userId, username) {
        this.currentChat = { userId, username };
        
        // Create or show modal
        let modal = document.getElementById('messagingModal');
        if (!modal) {
            modal = this.createModal();
            document.body.appendChild(modal);
        }

        modal.classList.add('active');
        document.getElementById('chatUsername').textContent = username;
        document.getElementById('messagesContainer').innerHTML = '';
        
        // Load chat history (would need backend support)
        this.loadChatHistory(userId);
    },

    // Create messaging modal
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'messagingModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="chatUsername">Chat</h3>
                    <button class="btn-icon" onclick="Messaging.closeChat()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="messages-container" id="messagesContainer"></div>
                    <div id="typing-indicator" class="hidden" style="font-size: 0.875rem; color: var(--gray-500); margin-top: 0.5rem;"></div>
                </div>
                <div class="modal-footer">
                    <input type="text" id="messageInput" class="form-input" placeholder="Type a message..." style="flex: 1;">
                    <button class="btn btn-primary" onclick="Messaging.sendMessage()">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            </div>
        `;

        // Handle Enter key
        setTimeout(() => {
            const input = document.getElementById('messageInput');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendMessage();
                    }
                });

                // Typing indicator
                input.addEventListener('input', () => {
                    if (this.currentChat) {
                        Socket.sendTyping(this.currentChat.userId, input.value.length > 0);
                    }
                });
            }
        }, 100);

        return modal;
    },

    // Close chat
    closeChat() {
        const modal = document.getElementById('messagingModal');
        if (modal) modal.classList.remove('active');
        this.currentChat = null;
    },

    // Send message
    sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input || !this.currentChat) return;

        const message = input.value.trim();
        if (!message) return;

        Socket.sendMessage(this.currentChat.userId, message);
        this.addMessageToChat({ message, timestamp: new Date() }, 'sent');
        
        input.value = '';
        Socket.sendTyping(this.currentChat.userId, false);
    },

    // Add message to chat
    addMessageToChat(data, type) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = data.message;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },

    // Load chat history
    async loadChatHistory(userId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await fetch(`${CONFIG.API_URL}/messages/conversation/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load chat history');
            }
            
            const data = await response.json();
            
            if (data.success && data.messages) {
                const container = document.getElementById('messagesContainer');
                if (!container) return;
                
                container.innerHTML = '';
                
                // Display all messages
                data.messages.forEach(msg => {
                    const isSent = msg.sender === (State.user.id || State.user._id);
                    this.addMessageToChat({
                        message: msg.message,
                        timestamp: msg.createdAt
                    }, isSent ? 'sent' : 'received');
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            Utils.showToast('Failed to load chat history', 'error');
        }
    }
};

// ============================================
// UI COMPONENTS & RENDERING
// ============================================
const UI = {
    // Render video card
    renderVideoCard(video) {
        const isBoosted = video.isBoosted && new Date(video.boostExpiresAt) > new Date();
        
        return `
            <div class="video-card" onclick="window.location.href='pages/archive.html?video=${video._id}'">
                <div style="position: relative;">
                    <img src="${video.thumbnail || 'https://via.placeholder.com/320x180/333333/FFFFFF?text=Video'}" 
                         alt="${video.title}" 
                         class="video-thumbnail">
                    ${isBoosted ? '<span class="boosted-badge"><i class="fas fa-rocket"></i> BOOSTED</span>' : ''}
                </div>
                <div class="video-info">
                    <h4 class="video-title">${video.title}</h4>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${Utils.formatNumber(video.views)}</span>
                        <span><i class="fas fa-thumbs-up"></i> ${video.upvotes.length}</span>
                        <span><i class="fas fa-comment"></i> ${video.comments.length}</span>
                    </div>
                    <div class="video-tags">
                        ${video.tags.map(tag => `<span class="tag tag-${tag.toLowerCase()}">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // Render comment
    renderComment(comment) {
        return `
            <div class="comment ${comment.isHighlighted ? 'highlighted' : ''}" id="comment-${comment._id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="user-avatar" style="width: 32px; height: 32px; background: ${Utils.getAvatarColor(comment.user.username)}">
                            ${Utils.getInitials(comment.user.username)}
                        </div>
                        <span>${comment.user.username}</span>
                        ${comment.isHighlighted ? '<i class="fas fa-star text-gold" title="Highlighted"></i>' : ''}
                    </div>
                    <span class="comment-timestamp">${Utils.formatDate(comment.createdAt)}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-actions">
                    <button class="btn btn-sm btn-secondary" onclick="Comments.reply('${comment._id}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    ${!comment.isHighlighted ? `
                        <button class="btn btn-sm btn-viking" onclick="Comments.highlight('${comment._id}')">
                            <i class="fas fa-star"></i> Highlight (20 RG)
                        </button>
                    ` : ''}
                </div>
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="comment-replies">
                        ${comment.replies.map(reply => `
                            <div class="comment">
                                <div class="comment-header">
                                    <div class="comment-author">
                                        <div class="user-avatar" style="width: 24px; height: 24px; background: ${Utils.getAvatarColor(reply.user.username)}">
                                            ${Utils.getInitials(reply.user.username)}
                                        </div>
                                        <span>${reply.user.username}</span>
                                    </div>
                                    <span class="comment-timestamp">${Utils.formatDate(reply.createdAt)}</span>
                                </div>
                                <div class="comment-content">${reply.content}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
};

// ============================================
// THEME MANAGEMENT
// ============================================
const Theme = {
    init() {
        const savedTheme = localStorage.getItem('mlnf_theme') || 'light';
        this.setTheme(savedTheme);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mlnf_theme', theme);
        
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        this.setTheme(current === 'light' ? 'dark' : 'light');
    }
};

// ============================================
// BREADCRUMBS (Rune-Path Tracker)
// ============================================
const Breadcrumbs = {
    init() {
        const saved = sessionStorage.getItem('mlnf_breadcrumbs');
        if (saved) {
            State.breadcrumbs = JSON.parse(saved);
            this.render();
        }
    },

    add(page) {
        // Remove if already exists
        State.breadcrumbs = State.breadcrumbs.filter(b => b.url !== page.url);
        
        // Add to end
        State.breadcrumbs.push(page);
        
        // Keep only last 5
        if (State.breadcrumbs.length > CONFIG.BREADCRUMB_MAX) {
            State.breadcrumbs.shift();
        }
        
        sessionStorage.setItem('mlnf_breadcrumbs', JSON.stringify(State.breadcrumbs));
        this.render();
    },

    clear() {
        State.breadcrumbs = [];
        sessionStorage.removeItem('mlnf_breadcrumbs');
        this.render();
    },

    render() {
        const container = document.getElementById('breadcrumbs');
        if (!container || State.breadcrumbs.length === 0) return;

        container.innerHTML = `
            <ul class="breadcrumb-list">
                ${State.breadcrumbs.map((crumb, index) => `
                    <li class="breadcrumb-item">
                        <img src="${crumb.thumbnail || 'https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=BC'}" 
                             alt="${crumb.title}" 
                             class="breadcrumb-thumbnail"
                             onclick="window.location.href='${crumb.url}'"
                             title="${crumb.title}">
                        ${index < State.breadcrumbs.length - 1 ? '<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>' : ''}
                    </li>
                `).join('')}
                <li class="breadcrumb-item">
                    <button class="btn btn-sm btn-secondary" onclick="Breadcrumbs.clear()">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </li>
            </ul>
        `;
    }
};

// ============================================
// PAGE-SPECIFIC INITIALIZERS
// ============================================
const PageHandlers = {
    // Homepage
    async initHomepage() {
        // Load trending videos
        try {
            const data = await API.videos.getTrending();
            const container = document.getElementById('trendingVideos');
            if (container && data.videos) {
                container.innerHTML = data.videos.map(v => UI.renderVideoCard(v)).join('');
            }
        } catch (error) {
            console.error('Failed to load trending videos:', error);
        }

        // Load boosted videos
        try {
            const data = await API.videos.getAll({ boosted: true, limit: 3 });
            const container = document.getElementById('boostedVideos');
            if (container && data.videos) {
                container.innerHTML = data.videos.map(v => UI.renderVideoCard(v)).join('');
            }
        } catch (error) {
            console.error('Failed to load boosted videos:', error);
        }
    }
};

// ============================================
// GLOBAL INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core systems
    Auth.init();
    Theme.init();
    Breadcrumbs.init();

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = sidebarToggle.querySelector('i');
            if (icon) {
                icon.className = sidebar.classList.contains('collapsed') 
                    ? 'fas fa-chevron-left' 
                    : 'fas fa-chevron-right';
            }
        });
    }

    // Page-specific initialization
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        PageHandlers.initHomepage();
    }

    console.log('MLNF initialized successfully');
});

// Export for global access
window.MLNF = {
    State,
    Utils,
    API,
    Auth,
    Socket,
    Messaging,
    UI,
    Theme,
    Breadcrumbs
};
};
