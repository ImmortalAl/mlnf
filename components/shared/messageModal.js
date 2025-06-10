// messageModal.js - Standardized Module Pattern

window.MLNF = window.MLNF || {};

window.MLNF.MessageModal = (function() {

    let messageModal, recipientNameElement, messageInputElement, messageHistoryElement, sendMessageBtnElement, closeMessageModalBtnElement;
    let currentBackdropListener = null;
    let currentRecipientUsername = null;
    let typingTimeout = null;
    let isInitialized = false;

    function init() {
        if (isInitialized) return;
        console.log('[MessageModal] Initializing...');
        
        messageModal = document.getElementById('messageModal');
        recipientNameElement = document.getElementById('recipientName');
        messageInputElement = document.getElementById('messageInput');
        messageHistoryElement = document.getElementById('messageHistory');
        sendMessageBtnElement = document.getElementById('sendMessageBtn');
        closeMessageModalBtnElement = document.getElementById('closeMessageModal');

        if (!messageModal || !closeMessageModalBtnElement) {
            console.warn('[MessageModal] Core modal elements not found. Cannot initialize.');
            return;
        }

        closeMessageModalBtnElement.addEventListener('click', close);

        if (sendMessageBtnElement) {
            sendMessageBtnElement.addEventListener('click', handleSendMessage);
        }

        if (messageInputElement) {
            messageInputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            });
            messageInputElement.addEventListener('input', handleTyping);
        }

        isInitialized = true;
        console.log('[MessageModal] Initialized successfully.');
    }

    async function open(username) {
        if (!isInitialized) {
            console.error('[MessageModal] Not initialized. Please call init() on page load.');
            return;
        }
        
        console.log(`[MessageModal] Opening for ${username}`);
        currentRecipientUsername = username;

        if (recipientNameElement) {
            recipientNameElement.textContent = `To: ${username}`;
        }
        if (messageHistoryElement) {
            messageHistoryElement.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
        }
        
        messageModal.classList.add('active');
        messageModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        if (messageInputElement) {
            setTimeout(() => messageInputElement.focus(), 100);
        }

        await loadConversation(username);
        
        setTimeout(() => {
            if (currentBackdropListener) {
                messageModal.removeEventListener('click', currentBackdropListener);
            }
            currentBackdropListener = (event) => {
                if (event.target === messageModal) {
                    close();
                }
            };
            messageModal.addEventListener('click', currentBackdropListener);
        }, 300);
    }

    function close() {
        if (!isInitialized || !messageModal) return;

        messageModal.classList.remove('active');
        messageModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        currentRecipientUsername = null;

        if (currentBackdropListener) {
            messageModal.removeEventListener('click', currentBackdropListener);
            currentBackdropListener = null;
        }
        console.log('[MessageModal] Closed.');
    }

    async function loadConversation(username) {
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No auth token');
            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/conversation/${username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const messages = await response.json();
            displayMessages(messages);
        } catch (error) {
            console.error('[MessageModal] Error loading conversation:', error);
            if(messageHistoryElement) messageHistoryElement.innerHTML = '<p class="modal-error">Failed to load messages.</p>';
        }
    }

    function displayMessages(messages) {
        if(!messageHistoryElement) return;
        messageHistoryElement.innerHTML = '';
        if (messages.length === 0) {
            messageHistoryElement.innerHTML = '<p class="modal-info">No messages yet. Start the conversation!</p>';
            return;
        }
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) return;
        const currentUserId = currentUser.id || currentUser._id;
        messages.forEach(message => addMessageToUI(message.content, (message.sender._id || message.sender.id) === currentUserId, false, new Date(message.timestamp)));
        messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
    }

    async function handleSendMessage() {
        if (!messageInputElement || !messageHistoryElement || !messageInputElement.value.trim() || !currentRecipientUsername) return;
        const messageText = messageInputElement.value.trim();
        messageInputElement.value = '';
        addMessageToUI(messageText, true, false, new Date());
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No auth token');
            await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipientUsername: currentRecipientUsername, content: messageText })
            });
        } catch (error) {
            console.error('[MessageModal] Error sending message:', error);
            addMessageToUI('Failed to send message.', true, true);
        }
    }

    function addMessageToUI(content, isSent, isError = false, timestamp = new Date()) {
        if(!messageHistoryElement) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'} ${isError ? 'error' : ''}`;
        const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.innerHTML = `<span class="message-text">${escapeHTML(content)}</span><span class="message-time">${time}</span>`;
        messageHistoryElement.appendChild(messageDiv);
        messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
    }

    function handleTyping() {
        if (!currentRecipientUsername || !window.MLNF || !window.MLNF.websocket) return;
        if (typingTimeout) clearTimeout(typingTimeout);
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser) {
            window.MLNF.websocket.sendTypingIndicator(currentRecipientUsername, true);
            typingTimeout = setTimeout(() => {
                window.MLNF.websocket.sendTypingIndicator(currentRecipientUsername, false);
            }, 2000);
        }
    }

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init: init,
        open: open,
        close: close
    };

})(); 