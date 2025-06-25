/**
 * MLNF WebSocket Client Manager
 * Handles real-time communication with the backend
 */
class MLNFWebSocket {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.messageHandlers = new Map();
        this.onlineUsers = new Set();
        
        // Bind methods to preserve context
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.send = this.send.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onOpen = this.onOpen.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
    }

    /**
     * Connect to WebSocket server
     */
    async connect() {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            console.warn('[WebSocket] No authentication token found');
            return false;
        }

        try {
            // Convert HTTP URL to WebSocket URL
            const wsUrl = MLNF_CONFIG.API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '');
            const fullUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
            
            
            this.ws = new WebSocket(fullUrl);
            this.ws.onopen = this.onOpen;
            this.ws.onmessage = this.onMessage;
            this.ws.onclose = this.onClose;
            this.ws.onerror = this.onError;
            
            return true;
        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
            return false;
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.reconnectAttempts = 0;
    }

    /**
     * Send message to server
     * @param {Object} data - Message data
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        } else {
            console.warn('[WebSocket] Cannot send message - not connected');
            return false;
        }
    }

    /**
     * Handle WebSocket open event
     */
    onOpen() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Trigger connection event
        this.triggerHandler('connection', { status: 'connected' });
    }

    /**
     * Handle incoming WebSocket messages
     * @param {MessageEvent} event - WebSocket message event
     */
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'connection':
                    this.triggerHandler('connection', data);
                    break;
                case 'newMessage':
                    this.triggerHandler('newMessage', data);
                    break;
                case 'messageDelivered':
                    this.triggerHandler('messageDelivered', data);
                    break;
                case 'typing':
                    this.triggerHandler('typing', data);
                    break;
                case 'userStatus':
                    this.handleUserStatus(data);
                    break;
                default:
                    console.warn('[WebSocket] Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('[WebSocket] Message parsing error:', error);
        }
    }

    /**
     * Handle WebSocket close event
     */
    onClose(event) {
        this.isConnected = false;
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
        }
        
        this.triggerHandler('disconnect', { code: event.code, reason: event.reason });
    }

    /**
     * Handle WebSocket error event
     */
    onError(error) {
        console.error('[WebSocket] Error:', error);
        this.triggerHandler('error', error);
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
        this.reconnectAttempts++;
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
        
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }

    /**
     * Handle user status updates
     * @param {Object} data - Status update data
     */
    handleUserStatus(data) {
        const { userId, status } = data;
        
        if (status === 'online') {
            this.onlineUsers.add(userId);
        } else {
            this.onlineUsers.delete(userId);
        }
        
        this.triggerHandler('userStatus', data);
    }

    /**
     * Register message handler
     * @param {string} type - Message type
     * @param {Function} handler - Handler function
     */
    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(handler);
    }

    /**
     * Remove message handler
     * @param {string} type - Message type
     * @param {Function} handler - Handler function to remove
     */
    off(type, handler) {
        if (this.messageHandlers.has(type)) {
            const handlers = this.messageHandlers.get(type);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Trigger message handlers
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    triggerHandler(type, data) {
        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[WebSocket] Handler error for ${type}:`, error);
                }
            });
        }
    }

    /**
     * Send typing indicator
     * @param {string} recipientId - ID of message recipient
     * @param {boolean} isTyping - Whether user is typing
     */
    sendTypingIndicator(recipientId, isTyping) {
        this.send({
            type: 'typing',
            recipientId,
            isTyping
        });
    }

    /**
     * Check if user is online
     * @param {string} userId - User ID to check
     * @returns {boolean} - True if user is online
     */
    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }

    /**
     * Get list of online users
     * @returns {Array} - Array of online user IDs
     */
    getOnlineUsers() {
        return Array.from(this.onlineUsers);
    }
}

// Create global WebSocket instance
window.MLNF = window.MLNF || {};
window.MLNF.websocket = new MLNFWebSocket();

// Auto-connect when user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
        window.MLNF.websocket.connect();
    }
});

 