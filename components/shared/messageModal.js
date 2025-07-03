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
    
    let scrollTimeout = null;
    let debugMode = true; // Enable debugging
    let DISABLE_ALL_SCROLLING = false; // Re-enabled since scrolling wasn't the problem

    function logDebug(message, data = {}) {
        if (debugMode) {
            console.log(`[MessageModal Debug] ${message}`, data);
        }
    }

    function scrollToBottom() {
        if (DISABLE_ALL_SCROLLING) {
            logDebug('SCROLLING DISABLED - not scrolling');
            return;
        }
        
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
            logDebug('Cancelled previous scroll timeout');
        }
        
        logDebug('Scheduling scroll to bottom', {
            currentScrollTop: messageHistoryElement?.scrollTop,
            currentScrollHeight: messageHistoryElement?.scrollHeight,
            currentClientHeight: messageHistoryElement?.clientHeight
        });
        
        scrollTimeout = setTimeout(() => {
            if (messageHistoryElement) {
                const beforeScroll = {
                    scrollTop: messageHistoryElement.scrollTop,
                    scrollHeight: messageHistoryElement.scrollHeight,
                    clientHeight: messageHistoryElement.clientHeight
                };
                
                messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
                
                const afterScroll = {
                    scrollTop: messageHistoryElement.scrollTop,
                    scrollHeight: messageHistoryElement.scrollHeight,
                    clientHeight: messageHistoryElement.clientHeight
                };
                
                logDebug('Executed scroll to bottom', { beforeScroll, afterScroll });
            }
        }, 100);
    }

    function addMessageToUI(content, isSent, isError = false, timestamp = new Date(), shouldScroll = true) {
        if(!messageHistoryElement) return;
        
        logDebug('Adding message to UI', {
            content: content.substring(0, 50) + '...',
            isSent,
            isError,
            shouldScroll,
            messageCount: messageHistoryElement.children.length,
            scrollDimensions: {
                scrollTop: messageHistoryElement.scrollTop,
                scrollHeight: messageHistoryElement.scrollHeight,
                clientHeight: messageHistoryElement.clientHeight
            }
        });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'} ${isError ? 'error' : ''}`;
        const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.innerHTML = `<span class="message-text">${escapeHTML(content)}</span><span class="message-time">${time}</span>`;
        messageHistoryElement.appendChild(messageDiv);
        
        logDebug('Message added to DOM', {
            newMessageCount: messageHistoryElement.children.length,
            newScrollDimensions: {
                scrollTop: messageHistoryElement.scrollTop,
                scrollHeight: messageHistoryElement.scrollHeight,
                clientHeight: messageHistoryElement.clientHeight
            }
        });
        
        // Use debounced scroll only for new messages
        if (shouldScroll) {
            scrollToBottom();
        }
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
        
        logDebug('Displaying messages', {
            messageCount: messages.length,
            containerBefore: {
                innerHTML: messageHistoryElement.innerHTML.length,
                children: messageHistoryElement.children.length
            }
        });
        
        messageHistoryElement.innerHTML = '';
        if (messages.length === 0) {
            messageHistoryElement.innerHTML = '<p class="modal-info">No messages yet.</p>';
            return;
        }
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) return;
        const currentUserId = currentUser.id || currentUser._id;
        
        logDebug('Processing messages for display', { currentUserId });
        
        messages.forEach((message, index) => {
            logDebug(`Processing message ${index + 1}/${messages.length}`, {
                sender: message.sender?.username,
                isSent: (message.sender._id || message.sender.id) === currentUserId
            });
            addMessageToUI(message.content, (message.sender._id || message.sender.id) === currentUserId, false, new Date(message.timestamp), false);
        });
        
        logDebug('All messages processed, scrolling to bottom');
        // Use the same debounced scroll for consistency
        scrollToBottom();
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
        
        // Restore body scroll position
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        
        currentRecipientUsername = null;
        if (currentBackdropListener) {
            messageModal.removeEventListener('click', currentBackdropListener);
            currentBackdropListener = null;
        }
        
        // Cleanup mobile keyboard detection
        if (messageModal.keyboardCleanup) {
            messageModal.keyboardCleanup();
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

    // Add scroll event listener to detect external scroll changes
    if (messageHistoryElement) {
        let lastScrollTop = 0;
        let lastScrollHeight = 0;
        
        messageHistoryElement.addEventListener('scroll', function(e) {
            const currentScrollTop = e.target.scrollTop;
            const currentScrollHeight = e.target.scrollHeight;
            
            // Only log if something actually changed
            if (currentScrollTop !== lastScrollTop || currentScrollHeight !== lastScrollHeight) {
                logDebug('⚠️ EXTERNAL SCROLL DETECTED - Something else is scrolling!', {
                    scrollTop: currentScrollTop,
                    scrollHeight: currentScrollHeight,
                    clientHeight: e.target.clientHeight,
                    scrollTopChange: currentScrollTop - lastScrollTop,
                    scrollHeightChange: currentScrollHeight - lastScrollHeight,
                    timestamp: new Date().toISOString()
                });
                
                lastScrollTop = currentScrollTop;
                lastScrollHeight = currentScrollHeight;
            }
        });
        
        // Add resize observer to detect layout changes
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    logDebug('Message history container resized', {
                        newSize: {
                            width: entry.contentRect.width,
                            height: entry.contentRect.height
                        },
                        scrollDimensions: {
                            scrollTop: messageHistoryElement.scrollTop,
                            scrollHeight: messageHistoryElement.scrollHeight,
                            clientHeight: messageHistoryElement.clientHeight
                        }
                    });
                }
            });
            resizeObserver.observe(messageHistoryElement);
        }
        
        // Add mutation observer to detect DOM changes
        if (window.MutationObserver) {
            const mutationObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        logDebug('DOM mutation detected in message history', {
                            addedNodes: mutation.addedNodes.length,
                            removedNodes: mutation.removedNodes.length,
                            target: mutation.target.tagName,
                            currentChildren: messageHistoryElement.children.length,
                            scrollDimensions: {
                                scrollTop: messageHistoryElement.scrollTop,
                                scrollHeight: messageHistoryElement.scrollHeight,
                                clientHeight: messageHistoryElement.clientHeight
                            },
                            stackTrace: new Error().stack.split('\n').slice(0, 5)
                        });
                    }
                });
            });
            mutationObserver.observe(messageHistoryElement, { 
                childList: true, 
                subtree: true 
            });
        }
    }

    // Set up WebSocket message listeners to handle incoming messages properly
    if (window.MLNF && window.MLNF.websocket) {
        window.MLNF.websocket.on('newMessage', handleIncomingMessage);
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
    
    // Setup mobile keyboard detection for professional UX
    setupMobileKeyboardDetection(messageModal);

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

    function handleIncomingMessage(data) {
        logDebug('Incoming WebSocket message received', {
            modalActive: messageModal?.classList.contains('active'),
            currentRecipient: currentRecipientUsername,
            sender: data.sender?.username,
            recipient: data.recipient?.username,
            messagePreview: data.content?.substring(0, 30) + '...'
        });
        
        // Only handle messages if modal is open and it's for the current conversation
        if (!messageModal || !messageModal.classList.contains('active') || !currentRecipientUsername) {
            logDebug('Ignoring WebSocket message - modal not active or no recipient');
            return;
        }
        
        // Check if message is part of current conversation
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
            logDebug('Ignoring WebSocket message - no current user');
            return;
        }
        
        const currentUserId = currentUser.id || currentUser._id;
        const isFromCurrentRecipient = data.sender._id === currentRecipientUsername || data.sender.username === currentRecipientUsername;
        const isToCurrentUser = data.recipient._id === currentUserId || data.recipient.id === currentUserId;
        
        logDebug('WebSocket message analysis', {
            currentUserId,
            isFromCurrentRecipient,
            isToCurrentUser,
            shouldAddMessage: isFromCurrentRecipient && isToCurrentUser
        });
        
        if (isFromCurrentRecipient && isToCurrentUser) {
            logDebug('Adding WebSocket message to UI');
            // Add the incoming message using our proper debounced scroll system
            addMessageToUI(data.content, false, false, new Date(data.timestamp), true);
        } else {
            logDebug('Ignoring WebSocket message - not for current conversation');
        }
    }

// Minimal mobile keyboard detection - DISABLED to prevent scrollbar issues
function setupMobileKeyboardDetection(modal) {
    if (!modal || window.innerWidth > 768) return;
    
    const inputElements = modal.querySelectorAll('input, textarea');
    inputElements.forEach(input => {
        // Prevent iOS zoom on input focus (keep this for UX)
        if (input.style.fontSize !== '16px') {
            input.style.fontSize = '16px';
        }
        
        // DISABLED: keyboard-detected class causes layout shifts and scrollbar jumping
        // input.addEventListener('focus', () => modal.classList.add('keyboard-detected'));
        // input.addEventListener('blur', () => {
        //     setTimeout(() => {
        //         if (!modal.querySelector('input:focus, textarea:focus')) {
        //             modal.classList.remove('keyboard-detected');
        //         }
        //     }, 100);
        // });
    });
    
    // Simple cleanup function (now just removes any existing class)
    modal.keyboardCleanup = function() {
        modal.classList.remove('keyboard-detected');
    };
}

// Expose to global MLNF object
window.MLNF.initMessageModal = initMessageModal;
    window.MLNF.openMessageModal = openMessageModal; // Still useful to expose for direct calls if needed
})(); 