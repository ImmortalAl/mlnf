let messageModal, recipientNameElement, messageInputElement, messageHistoryElement, sendMessageBtnElement, closeMessageModalBtnElement;
let currentBackdropListener = null; // Track the current backdrop click listener
let currentRecipientUsername = null; // Track current conversation
let typingTimeout = null; // For typing indicator debouncing

function initMessageModal() {
    console.log('[messageModal.js] Initializing...');
    messageModal = document.getElementById('messageModal');
    recipientNameElement = document.getElementById('recipientName'); // Inside the modal
    messageInputElement = document.getElementById('messageInput'); // Inside the modal
    messageHistoryElement = document.getElementById('messageHistory'); // Inside the modal
    sendMessageBtnElement = document.getElementById('sendMessageBtn'); // Inside the modal
    closeMessageModalBtnElement = document.getElementById('closeMessageModal'); // Inside the modal

    if (!messageModal || !recipientNameElement || !messageInputElement || !messageHistoryElement || !sendMessageBtnElement || !closeMessageModalBtnElement) {
        console.warn('[messageModal.js] One or more modal elements not found. Modal may not function correctly.');
        return;
    }

    if (closeMessageModalBtnElement) {
        closeMessageModalBtnElement.addEventListener('click', closeMessageModal);
    }

    if (sendMessageBtnElement) {
        sendMessageBtnElement.addEventListener('click', handleSendMessage);
    }

    // Add Enter key support for sending messages
    if (messageInputElement) {
        messageInputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Add typing indicator
        messageInputElement.addEventListener('input', handleTyping);
    }

    // Set up WebSocket message handlers
    if (window.MLNF && window.MLNF.websocket) {
        window.MLNF.websocket.on('newMessage', handleIncomingMessage);
        window.MLNF.websocket.on('typing', handleTypingIndicator);
    }

    console.log('[messageModal.js] Initialized.');
}

async function openMessageModal(username) {
    if (!messageModal || !recipientNameElement) {
        console.error('[messageModal.js] Modal elements not found.');
        return;
    }

    console.log(`[messageModal.js] Opening message modal for ${username}`);

    currentRecipientUsername = username;
    recipientNameElement.textContent = username;
    messageHistoryElement.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
    
    // Use the proper modal system with .active class
    messageModal.classList.add('active');
    messageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scroll

    // Focus the input for better UX
    if (messageInputElement) {
        setTimeout(() => messageInputElement.focus(), 100);
    }

    // Load conversation history
    await loadConversation(username);
    
    // Add click outside to close functionality with proper cleanup
    setTimeout(() => {
        // Remove any existing listener before adding a new one
        if (currentBackdropListener) {
            messageModal.removeEventListener('click', currentBackdropListener);
        }
        
        // Create new listener
        currentBackdropListener = (event) => {
            if (event.target === messageModal) {
                console.log('[messageModal.js] Valid backdrop click detected, closing modal.');
                closeMessageModal();
            }
        };
        
        messageModal.addEventListener('click', currentBackdropListener);
        console.log('[messageModal.js] Click outside listener attached after 300ms delay.');
    }, 300); // Delay to prevent immediate closing from button click propagation
}

function closeMessageModal() {
    if (!messageModal) {
        console.error('[messageModal.js] Modal element not found.');
        return;
    }

    console.log('[messageModal.js] Closing message modal.');
    
    // Use the proper modal system
    messageModal.classList.remove('active');
    messageModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore background scroll
    
    currentRecipientUsername = null;

    // Clean up backdrop listener
    if (currentBackdropListener) {
        messageModal.removeEventListener('click', currentBackdropListener);
        currentBackdropListener = null;
    }

    console.log('[messageModal.js] Modal closed.');
}

async function loadConversation(username) {
    try {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            console.error('[messageModal.js] No authentication token found');
            return;
        }

        const response = await fetch(`${MLNF_CONFIG.API_BASE_URL}/messages/conversation/${username}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error('[messageModal.js] Error loading conversation:', error);
        messageHistoryElement.innerHTML = '<p class="modal-error">Failed to load messages. Please try again.</p>';
    }
}

function displayMessages(messages) {
    messageHistoryElement.innerHTML = '';
    
    if (messages.length === 0) {
        messageHistoryElement.innerHTML = '<p class="modal-info">No messages yet. Start the conversation!</p>';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        const isSent = message.sender._id === currentUser.id;
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <span class="message-text">${escapeHTML(message.content)}</span>
            <span class="message-time">${timestamp}</span>
        `;
        
        messageHistoryElement.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
}

async function handleSendMessage() {
    if (!messageInputElement || !messageHistoryElement || !messageInputElement.value.trim()) {
        console.warn('[messageModal.js] Cannot send message, input or history element missing, or message empty.');
        return;
    }

    const messageText = messageInputElement.value.trim();
    const recipientUsername = currentRecipientUsername;

    if (!recipientUsername) {
        console.error('[messageModal.js] No recipient specified');
        return;
    }

    // Clear input immediately for better UX
    messageInputElement.value = '';

    // Add message to UI optimistically
    addMessageToUI(messageText, true);

    try {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            console.error('[messageModal.js] No authentication token found');
            return;
        }

        const response = await fetch(`${MLNF_CONFIG.API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientUsername: recipientUsername,
                content: messageText
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('[messageModal.js] Message sent successfully:', result);

    } catch (error) {
        console.error('[messageModal.js] Error sending message:', error);
        // Show error message to user
        addMessageToUI('Failed to send message. Please try again.', false, true);
    }
}

function addMessageToUI(content, isSent, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'} ${isError ? 'error' : ''}`;
    
    const timestamp = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <span class="message-text">${escapeHTML(content)}</span>
        <span class="message-time">${timestamp}</span>
    `;
    
    messageHistoryElement.appendChild(messageDiv);
    messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
}

function handleIncomingMessage(data) {
    // Only show message if it's for the current conversation
    if (currentRecipientUsername && data.message && data.message.sender.username === currentRecipientUsername) {
        addMessageToUI(data.message.content, false);
    }
}

function handleTyping(e) {
    if (!currentRecipientUsername || !window.MLNF || !window.MLNF.websocket) {
        return;
    }

    // Clear previous timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Send typing indicator
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
        window.MLNF.websocket.sendTypingIndicator(currentRecipientUsername, true);
        
        // Stop typing indicator after 2 seconds of no input
        typingTimeout = setTimeout(() => {
            window.MLNF.websocket.sendTypingIndicator(currentRecipientUsername, false);
        }, 2000);
    }
}

function handleTypingIndicator(data) {
    // Show typing indicator for current conversation
    if (currentRecipientUsername && data.senderId === currentRecipientUsername) {
        // TODO: Implement typing indicator UI
        console.log(`[messageModal.js] ${currentRecipientUsername} is ${data.isTyping ? 'typing' : 'not typing'}`);
    }
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose to global MLNF object
window.MLNF = window.MLNF || {};
window.MLNF.initMessageModal = initMessageModal;
window.MLNF.openMessageModal = openMessageModal;
window.MLNF.closeMessageModal = closeMessageModal; 