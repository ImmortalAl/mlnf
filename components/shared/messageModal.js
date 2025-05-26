let messageModal, recipientNameElement, messageInputElement, messageHistoryElement, sendMessageBtnElement, closeMessageModalBtnElement;

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
    console.log('[messageModal.js] Initialized.');
}

function openMessageModal(username) {
    if (!messageModal || !recipientNameElement) {
        console.error('[messageModal.js] Cannot open modal, essential elements missing.');
        return;
    }
    console.log(`[messageModal.js] Opening message modal for ${username}`);
    
    // Close active users sidebar if it's open to prevent overlay conflicts
    const activeUsersSidebar = document.getElementById('activeUsers');
    const activeUsersOverlay = document.getElementById('activeUsersOverlay');
    if (activeUsersSidebar && activeUsersSidebar.classList.contains('active')) {
        activeUsersSidebar.classList.remove('active');
        if (activeUsersOverlay) {
            activeUsersOverlay.classList.remove('active');
        }
        console.log('[messageModal.js] Closed active users sidebar to prevent overlay conflicts');
    }
    
    recipientNameElement.textContent = username;
    messageModal.style.display = 'flex'; // Or your preferred way to show it, e.g., add class
    if(messageInputElement) messageInputElement.focus();
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Add click outside to close functionality
    setTimeout(() => {
        messageModal.addEventListener('click', handleModalBackgroundClick);
    }, 100); // Small delay to prevent immediate closing if opened by click
}

function closeMessageModal() {
    if (!messageModal) return;
    console.log('[messageModal.js] Closing message modal.');
    messageModal.style.display = 'none'; // Or remove active class
    document.body.style.overflow = ''; // Restore background scroll
    if (messageInputElement) messageInputElement.value = '';
    // Optionally clear messageHistoryElement.innerHTML = '';
    
    // Remove click outside event listener to prevent memory leaks
    messageModal.removeEventListener('click', handleModalBackgroundClick);
}

function handleSendMessage() {
    if (!messageInputElement || !messageHistoryElement || !messageInputElement.value.trim()) {
        console.warn('[messageModal.js] Cannot send message, input or history element missing, or message empty.');
        return;
    }
    console.log('[messageModal.js] Sending message...');

    const messageText = messageInputElement.value.trim();

    // Add message to history (as sent)
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent'; // Ensure these classes are styled
    messageDiv.innerHTML = `
        <span class="message-text">${escapeHTML(messageText)}</span>
        <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    messageHistoryElement.appendChild(messageDiv);
    messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;

    messageInputElement.value = '';

    // TODO: Actual message sending logic via API would go here
    console.log(`[messageModal.js] Message to send: ${messageText} to ${recipientNameElement.textContent}`);

    // Simulate receiving a response (for UI testing)
    setTimeout(() => {
        const responseDiv = document.createElement('div');
        responseDiv.className = 'message received'; // Ensure these classes are styled
        responseDiv.innerHTML = `
            <span class="message-text">Automated reply: Your wisdom resonates across the eternal planes...</span>
            <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        messageHistoryElement.appendChild(responseDiv);
        messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
    }, 1500);
}

function handleModalBackgroundClick(event) {
    // Only close if clicking on the modal background (not the modal content)
    if (event.target === messageModal) {
        console.log('[messageModal.js] Clicked outside modal content, closing modal.');
        closeMessageModal();
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"/]/g, function (s) {
        const entityMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#x2F;'
        };
        return entityMap[s];
    });
}

// Expose to global MLNF object
window.MLNF = window.MLNF || {};
window.MLNF.initMessageModal = initMessageModal;
window.MLNF.openMessageModal = openMessageModal;
window.MLNF.closeMessageModal = closeMessageModal; // Optional: if other components need to close it 