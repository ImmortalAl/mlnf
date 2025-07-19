// activeUsers.js - Handles the active users sidebar

function injectActiveUsersSidebar() {
    // Check if sidebar and button already exist (e.g. hardcoded in HTML)
    // For this component, we'll assume the button (#showUsersBtn) and sidebar panel (#activeUsers)
    // are already in the HTML (as per index.html structure).
    // We only need to create and append the overlay if it's not there.

    if (!document.getElementById('activeUsersOverlay')) {
        const overlayHTML = '<div class="active-users-overlay" id="activeUsersOverlay"></div>';
        const overlayContainer = document.createElement('div');
        overlayContainer.innerHTML = overlayHTML;
        document.body.appendChild(overlayContainer.firstChild);
    }

    // If showUsersBtn is missing but activeUsers sidebar exists, create the button
    if (!document.getElementById('showUsersBtn') && document.getElementById('activeUsers')) {
        // Check if floating-buttons container exists
        let floatingButtons = document.querySelector('.floating-buttons');
        
        if (!floatingButtons) {
            // Create floating buttons container
            floatingButtons = document.createElement('div');
            floatingButtons.className = 'floating-buttons';
            document.body.appendChild(floatingButtons);
        }

        // Create the show users button
        const showUsersBtn = document.createElement('button');
        showUsersBtn.className = 'show-users-btn';
        showUsersBtn.id = 'showUsersBtn';
        showUsersBtn.setAttribute('aria-label', 'Show active users');
        showUsersBtn.innerHTML = '<i class="fas fa-users"></i>';
        
        floatingButtons.appendChild(showUsersBtn);
    }
}

function setupActiveUsersEvents() {
    const showUsersBtn = document.getElementById('showUsersBtn');
    const activeUsersSidebar = document.getElementById('activeUsers'); // The sidebar panel itself
    const closeUsersBtn = document.getElementById('closeUsers'); // The 'X' button inside the sidebar
    const activeUsersOverlay = document.getElementById('activeUsersOverlay');

    // Elements validation - check what's missing
    const missingElements = [];
    if (!showUsersBtn) missingElements.push('showUsersBtn');
    if (!activeUsersSidebar) missingElements.push('activeUsers'); 
    if (!activeUsersOverlay) missingElements.push('activeUsersOverlay');

    if (showUsersBtn && activeUsersSidebar && activeUsersOverlay) {
        showUsersBtn.addEventListener('click', () => {
            // Force clear any lingering force-close class
            activeUsersSidebar.classList.remove('force-close');
            activeUsersSidebar.style.right = ''; // Clear any inline style

            // Make overlay active and show sidebar 
            activeUsersOverlay.classList.add('active');
            activeUsersSidebar.classList.add('active');
            
            document.body.style.overflow = 'hidden';
        });

        // Prevent sidebar clicks from closing the sidebar
        activeUsersSidebar.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Fix: Always close sidebar on overlay or X click
        let isClosing = false; // Prevent multiple rapid calls
        const closeActiveSidebar = (event) => {
            if (isClosing) return;
            isClosing = true;

            activeUsersSidebar.classList.remove('active');
            activeUsersOverlay.classList.remove('active');

            activeUsersSidebar.style.right = ''; // Clear any inline style from opening
            activeUsersOverlay.style.opacity = ''; // Clear any inline style from opening

            activeUsersSidebar.classList.add('force-close');

            // Force reflow
            activeUsersSidebar.offsetHeight; 

            // Restore scrolling by removing the overflow style completely
            document.body.style.removeProperty('overflow');
            
            setTimeout(() => {
                activeUsersSidebar.classList.remove('force-close');
                isClosing = false;
            }, 350); 
        };

        const closeUsersBtnHandler = (event) => {
            closeActiveSidebar(event); // Utilize the main closing logic
        };

        if (closeUsersBtn) {
            closeUsersBtn.onclick = null;
            closeUsersBtn.onclick = closeUsersBtnHandler;
        } else {
            console.warn('[activeUsers.js] Close button (#closeUsers) not found.');
        }
        
        activeUsersOverlay.onclick = null;
        activeUsersOverlay.onclick = closeActiveSidebar;

    } else {
        if (missingElements.length > 0) {
            console.warn(`[activeUsers.js] Missing required elements: ${missingElements.join(', ')}. Active users sidebar functionality disabled.`);
        }
        // Still try to populate user list if the sidebar exists
        if (activeUsersSidebar) {
            populateActiveUsersList();
        }
        return; // Exit early
    }

    // Future: Populate user list, handle message button clicks, etc.
    populateActiveUsersList(); // Basic population
}

async function populateActiveUsersList() {
    const userListDiv = document.getElementById('userList');
    if (!userListDiv) {
        return; // Silently fail if userList not found
    }

    const token = localStorage.getItem('sessionToken');
    if (!token) {
        userListDiv.innerHTML = '<p class="login-required">Please log in to see active souls.</p>';
        return;
    }

    userListDiv.innerHTML = '<p class="loading-users">Summoning eternal souls...</p>'; // Loading message

    try {
        // Skip health check - the actual API call will determine connectivity
        
        
        // Try the online users endpoint first
        let response;
        let fetchedUsers;
        
        try {
            response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/online?_cb=${new Date().getTime()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                fetchedUsers = await response.json();
            } else {
                throw new Error(`Online users endpoint failed: ${response.status}`);
            }
        } catch (onlineError) {
            console.warn('[activeUsers.js] /users/online failed, trying fallback:', onlineError.message);
            
            // Fallback to general users endpoint
            response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users?_cb=${new Date().getTime()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Fallback users endpoint also failed: ${response.status} ${response.statusText}`);
            }
            
            const allUsers = await response.json();
            
            // Filter for online users, excluding banned users
            if (Array.isArray(allUsers)) {
                fetchedUsers = allUsers.filter(user => user.online === true && !user.banned).slice(0, 10);
                if (fetchedUsers.length === 0) {
                    // If no online non-banned users, show recent non-banned users
                    fetchedUsers = allUsers.filter(user => !user.banned).slice(0, 5);
                }
            } else if (allUsers.users && Array.isArray(allUsers.users)) {
                fetchedUsers = allUsers.users.filter(user => user.online === true && !user.banned).slice(0, 10);
                if (fetchedUsers.length === 0) {
                    fetchedUsers = allUsers.users.filter(user => !user.banned).slice(0, 5);
                }
            } else {
                throw new Error('Unexpected users response format');
            }
            
        }

        if (fetchedUsers && fetchedUsers.length > 0) {
            // Clear existing content
            userListDiv.innerHTML = '';
            
            fetchedUsers.forEach(user => {
                const displayName = user.displayName || user.username || 'Unnamed Soul';
                const username = user.username || displayName;
                const isOnline = user.online === true;
                const statusMessage = user.status && user.status.trim() !== '' ? user.status : 'Wandering the eternal realms...';
                
                
                // Create unified user display using MLNF Avatar System
                if (!window.MLNFAvatars) {
                    console.warn('[activeUsers.js] MLNFAvatars not available yet');
                    return;
                }
                
                const userDisplay = window.MLNFAvatars.createUserDisplay({
                    username: username,
                    title: null, // Don't show title to avoid duplicate names
                    status: statusMessage,
                    avatarSize: 'md',
                    displaySize: 'sm',
                    compact: true, // Use compact mode for sidebar
                    mystical: user.isVIP || user.role === 'admin',
                    online: isOnline,
                    customAvatar: user.avatar,
                    usernameStyle: 'immortal',
                    enableUnifiedNavigation: true
                });
                
                // Create user item container
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                
                // Add the unified user display
                userItem.appendChild(userDisplay);
                
                // Add message button
                const messageBtn = document.createElement('button');
                messageBtn.className = 'message-btn';
                messageBtn.setAttribute('data-username', username);
                messageBtn.setAttribute('aria-label', `Message ${displayName}`);
                messageBtn.innerHTML = '<i class="fas fa-comment"></i>';
                
                userItem.appendChild(messageBtn);
                userListDiv.appendChild(userItem);
            });
        } else {
            userListDiv.innerHTML = '<p class="no-users">No souls currently manifest.</p>';
        }

        // Re-attach event listeners for new message buttons
        userListDiv.querySelectorAll('.message-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation(); 
                event.preventDefault(); 
                const username = event.currentTarget.dataset.username;
                
                if (window.MLNF && typeof window.MLNF.openMessageModal === 'function') {
                    window.MLNF.openMessageModal(username);
                } else {
                    console.error(`[activeUsers.js] MLNF.openMessageModal function not found.`);
                }
            });
        });

    } catch (error) {
        console.error('[activeUsers.js] Error populating active users list:', error);
        console.error('[activeUsers.js] Error details:', {
            message: error.message,
            stack: error.stack,
            apiUrl: window.MLNF_CONFIG?.API_BASE_URL,
            hasToken: !!token
        });
        
        if (userListDiv) { 
            // Check if it's a network error and provide fallback
            if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
                userListDiv.innerHTML = `
                    <div class="error-users">
                        <p>⚡ Connection to the eternal realm is unstable</p>
                        <p style="font-size: 0.9em; opacity: 0.8;">The souls are temporarily unreachable</p>
                    </div>
                `;
            } else {
                const errorMessage = 'Could not summon souls. The aether is disturbed.';
                userListDiv.innerHTML = `<p class="error-users">${errorMessage}</p>`;
            }
        }
    }
}

function updateActiveUsersButtonVisibility() {
    const showUsersBtn = document.getElementById('showUsersBtn');
    if (!showUsersBtn) {
        return; // Silently skip if element not found
    }

    const token = localStorage.getItem('sessionToken');
    if (token) {
        showUsersBtn.style.display = 'flex'; // Or 'block', match CSS
    } else {
        showUsersBtn.style.display = 'none';
    }
}

function initActiveUsers() {
    injectActiveUsersSidebar();
    setupActiveUsersEvents();
    updateActiveUsersButtonVisibility();
    // Listen for auth changes to update visibility
    window.addEventListener('authChange', updateActiveUsersButtonVisibility);
}

// Expose the init function
window.MLNF = window.MLNF || {};
window.MLNF.initActiveUsers = initActiveUsers;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initActiveUsers);
} else {
    // DOM is already ready
    initActiveUsers();
}

// This component assumes its main HTML structures (#activeUsers sidebar, #showUsersBtn button)
// are already present in the main HTML file (e.g., index.html).
// It primarily adds the overlay and event behaviors. 