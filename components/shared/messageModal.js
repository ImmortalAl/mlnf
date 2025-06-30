// front/components/shared/messageModal.js - Standardized Module Pattern

(function() {
    window.MLNF = window.MLNF || {};

let messageModal, recipientNameElement, messageInputElement, messageHistoryElement, sendMessageBtnElement, closeMessageModalBtnElement;
    let currentBackdropListener = null;
    let currentRecipientUsername = null;
    let typingTimeout = null;
    let isInitialized = false;

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    async function handleSendMessage() {
        if (!messageInputElement || !messageInputElement.value.trim() || !currentRecipientUsername) return;
        const messageText = messageInputElement.value.trim();
        messageInputElement.value = '';
        addMessageToUI(messageText, true, false, new Date());
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No auth token');
            await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/send`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientUsername: currentRecipientUsername, content: messageText })
            });
        } catch (error) {
            console.error('[MessageModal] Error sending message:', error);
            addMessageToUI('Failed to send message.', true, true);
        }
    }
    
    function displayMessages(messages) {
        if(!messageHistoryElement) return;
        messageHistoryElement.innerHTML = '';
        if (messages.length === 0) {
            messageHistoryElement.innerHTML = '<p class="modal-info">No messages yet.</p>';
            return;
        }
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) return;
        const currentUserId = currentUser.id || currentUser._id;
        messages.forEach(message => addMessageToUI(message.content, (message.sender._id || message.sender.id) === currentUserId, false, new Date(message.timestamp)));
        messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
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
            if(messageHistoryElement) messageHistoryElement.innerHTML = '<p class="modal-error">Failed to load.</p>';
        }
    }

    function close() {
        if (!isInitialized || !messageModal) return;
        messageModal.classList.remove('active');
        messageModal.setAttribute('aria-hidden', 'true');
        document.body.style.removeProperty('overflow');
        currentRecipientUsername = null;
        if (currentBackdropListener) {
            messageModal.removeEventListener('click', currentBackdropListener);
            currentBackdropListener = null;
        }
    }

function initMessageModal() {
    messageModal = document.getElementById('messageModal');
        recipientNameElement = document.getElementById('recipientName'); 
        messageInputElement = document.getElementById('messageInput'); 
        messageHistoryElement = document.getElementById('messageHistory');
        sendMessageBtnElement = document.getElementById('sendMessageBtn');
        closeMessageModalBtnElement = document.getElementById('closeMessageModal');

        if (!messageModal || !closeMessageModalBtnElement) {
            console.warn('[messageModal.js] Core modal elements not found. Modal may not function correctly.');
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
}

async function openMessageModal(username) {
        if (!messageModal) {
            // Let's auto-init if needed, this makes it more robust
        initMessageModal();
            if(!messageModal) {
                 console.error('[messageModal.js] Modal not found even after auto-init.');
            return;
        }
    }


    currentRecipientUsername = username;
        if(recipientNameElement) recipientNameElement.textContent = `To: ${username}`;
        if(messageHistoryElement) messageHistoryElement.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
    
    // Close active users sidebar if open (prevents z-index conflicts on mobile)
    const activeUsersSidebar = document.getElementById('activeUsers');
    const activeUsersOverlay = document.getElementById('activeUsersOverlay');
    if (activeUsersSidebar && activeUsersSidebar.classList.contains('active')) {
        activeUsersSidebar.classList.remove('active');
        if (activeUsersOverlay) activeUsersOverlay.classList.remove('active');
    }
    
    messageModal.classList.add('active');
    messageModal.setAttribute('aria-hidden', 'false');
    messageModal.style.zIndex = '999999'; // Force highest z-index to override any CSS conflicts
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

// Expose to global MLNF object
window.MLNF.initMessageModal = initMessageModal;
    window.MLNF.openMessageModal = openMessageModal; // Still useful to expose for direct calls if needed
})(); 