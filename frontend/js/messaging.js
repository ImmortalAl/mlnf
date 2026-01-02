/**
 * MLNF Instant Messaging - Raven Messenger System
 * Viking-themed real-time messaging interface
 */

class RavenMessenger {
    constructor() {
        this.token = localStorage.getItem('mlnf_token');
        this.currentUser = null;
        this.conversations = [];
        this.activeConversation = null;
        this.socket = null;
    }

    async init() {
        // Get current user
        try {
            const response = await fetch('https://much-love-no-fear.onrender.com/api/auth/me', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            this.currentUser = data.user;
        } catch (error) {
            console.error('Failed to load user:', error);
            return;
        }

        // Load conversations
        await this.loadConversations();

        // Initialize Socket.IO for real-time messaging
        this.initSocket();

        // Render interface
        this.render();
    }

    initSocket() {
        // Connect to Socket.IO server
        this.socket = io('https://much-love-no-fear.onrender.com', {
            auth: { token: this.token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        // Connection events
        this.socket.on('connect', () => {
            console.log('🔗 Connected to messaging server');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('⚠️ Disconnected from messaging server');
            this.updateConnectionStatus(false);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected after', attemptNumber, 'attempts');
            this.loadConversations(); // Refresh conversations on reconnect
        });

        // Message events
        this.socket.on('message', (message) => {
            this.handleIncomingMessage(message);
        });

        this.socket.on('message:read', (data) => {
            this.handleMessageRead(data);
        });

        this.socket.on('typing', (data) => {
            this.handleTypingIndicator(data);
        });

        // User status events
        this.socket.on('user:online', (userId) => {
            this.updateUserOnlineStatus(userId, true);
        });

        this.socket.on('user:offline', (userId) => {
            this.updateUserOnlineStatus(userId, false);
        });
    }

    updateConnectionStatus(isConnected) {
        const statusIndicator = document.getElementById('connectionStatus');
        if (statusIndicator) {
            statusIndicator.textContent = isConnected ? 'Connected' : 'Disconnected';
            statusIndicator.style.color = isConnected ? 'var(--success)' : 'var(--error)';
        }
    }

    handleMessageRead(data) {
        // Update message read status
        const messageElements = document.querySelectorAll(`.message[data-message-id="${data.messageId}"]`);
        messageElements.forEach(el => {
            el.classList.add('read');
            const statusIcon = el.querySelector('.message-status');
            if (statusIcon) {
                statusIcon.innerHTML = '<i class="fas fa-check-double" style="color: var(--indigo);"></i>';
            }
        });
    }

    updateUserOnlineStatus(userId, isOnline) {
        const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`);
        userElements.forEach(el => {
            const statusDot = el.querySelector('.status-dot');
            if (statusDot) {
                statusDot.style.background = isOnline ? 'var(--success)' : 'var(--gray-400)';
            }
        });
    }

    async loadConversations() {
        try {
            const response = await fetch('https://much-love-no-fear.onrender.com/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            this.conversations = data.conversations || [];
        } catch (error) {
            console.error('Failed to load conversations:', error);
            this.conversations = [];
        }
    }

    async loadMessages(userId) {
        try {
            const response = await fetch(`https://much-love-no-fear.onrender.com/api/messages/conversation/${userId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            return data.messages || [];
        } catch (error) {
            console.error('Failed to load messages:', error);
            return [];
        }
    }

    async sendMessage(recipientId, content) {
        try {
            const response = await fetch('https://much-love-no-fear.onrender.com/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    recipientId,
                    message: content
                })
            });

            const data = await response.json();

            // Add raven flight animation
            this.animateRavenFlight();

            return data.message;
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    handleIncomingMessage(message) {
        // Add to active conversation if relevant
        if (this.activeConversation && message.sender === this.activeConversation.userId) {
            this.appendMessageToChat(message);
        }

        // Update conversation list
        this.updateConversationsList();

        // Play raven arrival sound (optional)
        // this.playRavenSound();
    }

    handleTypingIndicator(data) {
        if (this.activeConversation && data.userId === this.activeConversation.userId) {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.style.display = data.isTyping ? 'block' : 'none';
            }
        }
    }

    animateRavenFlight() {
        // Create raven element that flies across screen
        const raven = document.createElement('div');
        raven.className = 'raven-messenger';
        raven.innerHTML = '<i class="fas fa-crow"></i>';
        document.body.appendChild(raven);

        // Trigger animation
        setTimeout(() => {
            raven.classList.add('flying');
        }, 10);

        // Remove after animation
        setTimeout(() => {
            raven.remove();
        }, 1500);
    }

    render() {
        const container = document.getElementById('messagesSection');
        if (!container) return;

        container.innerHTML = `
            <div class="raven-messenger-container">
                <!-- Conversation List -->
                <div class="conversation-list">
                    <div class="conversation-header">
                        <h3><i class="fas fa-crow"></i> Raven Hall</h3>
                        <button class="btn-icon" id="newConversationBtn" title="Send New Raven">
                            <i class="fas fa-feather-alt"></i>
                        </button>
                    </div>
                    <div class="conversation-search">
                        <input type="text" placeholder="Search warriors..." id="conversationSearch">
                    </div>
                    <div class="conversations" id="conversationsList">
                        ${this.renderConversationsList()}
                    </div>
                </div>

                <!-- Message Thread -->
                <div class="message-thread">
                    <div class="message-thread-header" id="threadHeader">
                        <div class="thread-header-empty">
                            <i class="fas fa-scroll"></i>
                            <p>Select a conversation to begin</p>
                        </div>
                    </div>
                    <div class="message-thread-body" id="messageThread">
                        <!-- Messages appear here -->
                    </div>
                    <div class="message-thread-footer" id="threadFooter">
                        <!-- Input appears when conversation selected -->
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderConversationsList() {
        if (this.conversations.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-dove"></i>
                    <p>No ravens sent yet</p>
                    <small>Start a conversation with a fellow warrior</small>
                </div>
            `;
        }

        return this.conversations.map(conv => `
            <div class="conversation-item ${conv.unread ? 'unread' : ''}" data-user-id="${conv.userId}">
                <img src="${conv.avatar || 'https://via.placeholder.com/150/4A90E2/FFFFFF?text=' + conv.username[0]}"
                     alt="${conv.username}"
                     class="conversation-avatar">
                <div class="conversation-info">
                    <div class="conversation-name">${conv.username}</div>
                    <div class="conversation-preview">${conv.lastMessage || 'No messages yet'}</div>
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${this.formatTime(conv.lastMessageTime)}</span>
                    ${conv.unread ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    async openConversation(userId) {
        // Load messages for this user
        const messages = await this.loadMessages(userId);

        this.activeConversation = {
            userId,
            messages
        };

        // Find user info from conversations
        const conv = this.conversations.find(c => c.userId === userId);

        // Render header
        const header = document.getElementById('threadHeader');
        header.innerHTML = `
            <div class="thread-user-info">
                <img src="${conv?.avatar || 'https://via.placeholder.com/150'}" alt="${conv?.username}">
                <div>
                    <h4>${conv?.username || 'Warrior'}</h4>
                    <span class="status-online"><i class="fas fa-circle"></i> Online</span>
                </div>
            </div>
            <div class="thread-actions">
                <button class="btn-icon" title="Video call"><i class="fas fa-video"></i></button>
                <button class="btn-icon" title="More"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;

        // Render messages
        const thread = document.getElementById('messageThread');
        thread.innerHTML = messages.map(msg => this.renderMessage(msg)).join('');

        // Scroll to bottom
        thread.scrollTop = thread.scrollHeight;

        // Render input
        const footer = document.getElementById('threadFooter');
        footer.innerHTML = `
            <div class="message-input-container">
                <button class="btn-icon" title="Attach file">
                    <i class="fas fa-paperclip"></i>
                </button>
                <textarea
                    id="messageInput"
                    placeholder="Send a raven..."
                    rows="1"
                    maxlength="1000"></textarea>
                <button class="btn-primary btn-icon" id="sendMessageBtn" title="Send">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div class="typing-indicator" id="typingIndicator" style="display: none;">
                <span></span><span></span><span></span>
                ${conv?.username} is writing...
            </div>
        `;

        // Attach send handler
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.handleSendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize textarea
        const textarea = document.getElementById('messageInput');
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });

        // Setup typing indicator
        this.setupTypingIndicator();
    }

    renderMessage(message) {
        const isOwn = message.sender === this.currentUser._id || message.sender?.toString() === this.currentUser._id;
        const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="message ${isOwn ? 'message-own' : 'message-other'}">
                ${!isOwn ? `<img src="${message.senderAvatar || 'https://via.placeholder.com/40'}" alt="${message.senderName}" class="message-avatar">` : ''}
                <div class="message-content">
                    <div class="message-bubble">
                        ${message.message || message.content}
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }

    async handleSendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content || !this.activeConversation) return;

        try {
            // Stop typing indicator
            this.socket.emit('typing:stop', { userId: this.activeConversation.userId });

            // Send message
            const message = await this.sendMessage(this.activeConversation.userId, content);

            // Add to thread
            this.appendMessageToChat(message);

            // Clear input
            input.value = '';
            input.style.height = 'auto';

            // Scroll to bottom
            const thread = document.getElementById('messageThread');
            thread.scrollTop = thread.scrollHeight;

            // Play send sound (optional)
            this.playSendSound();
        } catch (error) {
            console.error('Failed to send message:', error);
            window.MLNF.showToast('Failed to send message. Please try again.', 'error');
        }
    }

    playSendSound() {
        // Simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Silently fail if audio not supported
        }
    }

    setupTypingIndicator() {
        const input = document.getElementById('messageInput');
        if (!input || !this.activeConversation) return;

        let typingTimeout;

        input.addEventListener('input', () => {
            // Send typing start
            this.socket.emit('typing:start', { userId: this.activeConversation.userId });

            // Clear previous timeout
            clearTimeout(typingTimeout);

            // Stop typing after 2 seconds of inactivity
            typingTimeout = setTimeout(() => {
                this.socket.emit('typing:stop', { userId: this.activeConversation.userId });
            }, 2000);
        });

        input.addEventListener('blur', () => {
            clearTimeout(typingTimeout);
            this.socket.emit('typing:stop', { userId: this.activeConversation.userId });
        });
    }

    appendMessageToChat(message) {
        const thread = document.getElementById('messageThread');
        if (!thread) return;

        const messageEl = document.createElement('div');
        messageEl.innerHTML = this.renderMessage(message);
        thread.appendChild(messageEl.firstElementChild);

        // Scroll to bottom with smooth animation
        thread.scrollTo({
            top: thread.scrollHeight,
            behavior: 'smooth'
        });
    }

    attachEventListeners() {
        // Conversation item clicks
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                this.openConversation(userId);
            });
        });

        // New conversation button
        const newBtn = document.getElementById('newConversationBtn');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.showNewConversationDialog());
        }

        // Search
        const search = document.getElementById('conversationSearch');
        if (search) {
            search.addEventListener('input', (e) => this.filterConversations(e.target.value));
        }
    }

    showNewConversationDialog() {
        // TODO: Implement new conversation dialog with user search
        alert('New conversation feature coming soon!');
    }

    filterConversations(query) {
        const items = document.querySelectorAll('.conversation-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const username = item.querySelector('.conversation-name').textContent.toLowerCase();
            item.style.display = username.includes(lowerQuery) ? 'flex' : 'none';
        });
    }

    formatTime(timestamp) {
        if (!timestamp) return '';

        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;

        return then.toLocaleDateString();
    }

    updateConversationsList() {
        // Reload conversations and re-render
        this.loadConversations().then(() => {
            const list = document.getElementById('conversationsList');
            if (list) {
                list.innerHTML = this.renderConversationsList();
                this.attachEventListeners();
            }
        });
    }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ravenMessenger = new RavenMessenger();
    });
} else {
    window.ravenMessenger = new RavenMessenger();
}
