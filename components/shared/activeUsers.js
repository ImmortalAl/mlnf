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
        console.log('[activeUsers.js] Overlay injected.');
    } else {
        console.log('[activeUsers.js] Overlay already exists.');
    }
}

function setupActiveUsersEvents() {
    const showUsersBtn = document.getElementById('showUsersBtn');
    const activeUsersSidebar = document.getElementById('activeUsers'); // The sidebar panel itself
    const closeUsersBtn = document.getElementById('closeUsers'); // The 'X' button inside the sidebar
    const activeUsersOverlay = document.getElementById('activeUsersOverlay');

    console.log('[activeUsers.js] setupActiveUsersEvents: Elements found - showBtn:', !!showUsersBtn, 'sidebar:', !!activeUsersSidebar, 'closeBtn:', !!closeUsersBtn, 'overlay:', !!activeUsersOverlay);

    if (showUsersBtn && activeUsersSidebar && activeUsersOverlay) {
        showUsersBtn.addEventListener('click', () => {
            console.log('[activeUsers.js] showUsersBtn clicked. Attempting to activate sidebar and overlay.');
            console.log('[activeUsers.js] Sidebar element before add class:', activeUsersSidebar);
            activeUsersSidebar.classList.add('active');
            activeUsersOverlay.classList.add('active');
            console.log('[activeUsers.js] Sidebar classList after add:', activeUsersSidebar.classList);
            console.log('[activeUsers.js] Overlay classList after add:', activeUsersOverlay.classList);
            setTimeout(() => {
                const rect = activeUsersSidebar.getBoundingClientRect();
                const compRight = getComputedStyle(activeUsersSidebar).right;
                console.log('[activeUsers.js] Sidebar bounding rect after activation:', rect);
                console.log('[activeUsers.js] Computed right style:', compRight);
                if (compRight === '-320px') {
                    console.warn('[activeUsers.js] Sidebar still off-screen after activation; applying inline fallback.');
                    activeUsersSidebar.style.right = '0px'; // Fallback
                }
            }, 350); // wait for transition
            document.body.style.overflow = 'hidden';
        });

        const closeActiveSidebar = () => {
            console.log('[activeUsers.js] closeActiveSidebar called. Attempting to deactivate.');
            console.log('[activeUsers.js] Sidebar element before remove class:', activeUsersSidebar);
            activeUsersSidebar.classList.remove('active');
            activeUsersOverlay.classList.remove('active');
            console.log('[activeUsers.js] Sidebar classList after remove:', activeUsersSidebar.classList);
            console.log('[activeUsers.js] Overlay classList after remove:', activeUsersOverlay.classList);
            document.body.style.overflow = '';
        };

        if (closeUsersBtn) {
            closeUsersBtn.addEventListener('click', closeActiveSidebar);
        } else {
            console.warn('[activeUsers.js] Close button (#closeUsers) not found inside sidebar.');
        }
        
        activeUsersOverlay.addEventListener('click', closeActiveSidebar);

    } else {
        console.warn('[activeUsers.js] Could not find one or more required elements for active users sidebar. Events not fully attached.');
    }

    // Future: Populate user list, handle message button clicks, etc.
    populateActiveUsersList(); // Basic population
}

async function populateActiveUsersList() {
    const userListDiv = document.getElementById('userList');
    if (!userListDiv) {
        console.warn('[activeUsers.js] userList div not found.');
        return;
    }

    const token = localStorage.getItem('sessionToken');
    if (!token) {
        console.log('[activeUsers.js] No session token found. Skipping fetch for active users.');
        userListDiv.innerHTML = '<p class="login-required">Please log in to see active souls.</p>';
        return;
    }

    userListDiv.innerHTML = '<p class="loading-users">Summoning eternal souls...</p>'; // Loading message

    try {
        const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/online`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch active users: ${response.status} ${response.statusText}`);
        }
        const fetchedUsers = await response.json();

        // Assuming fetchedUsers is an array of user objects.
        // Example mapping, adjust based on actual API response structure:
        // API might return: { username: 'xxx', avatarUrl: 'yyy', status: 'Online', isOnline: true }
        // HTML template expects: { name: 'xxx', avatar: 'yyy', status: 'Online' }

        if (fetchedUsers && fetchedUsers.length > 0) {
            userListDiv.innerHTML = fetchedUsers.map(user => {
                const displayName = user.username || user.name || 'Unnamed Soul';
                const avatarUrl = user.avatarUrl || user.avatar || (window.MLNF_CONFIG?.DEFAULT_AVATAR || '../assets/images/default-avatar.png');
                let currentStatus = user.status || (user.isOnline ? 'Online' : 'Offline');
                if (typeof currentStatus !== 'string') { // Ensure status is a string for .toLowerCase()
                    currentStatus = user.isOnline ? 'Online' : 'Offline';
                }

                return `
                <div class="user-item">
                    <img src="${avatarUrl}" alt="${displayName}">
                    <div class="user-info">
                        <h4>${displayName}</h4>
                        <span class="status ${currentStatus.toLowerCase()}">${currentStatus}</span>
                    </div>
                    <button class="message-btn" data-username="${displayName}" aria-label="Message ${displayName}">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>`;
            }).join('');
        } else {
            userListDiv.innerHTML = '<p class="no-users">No souls currently manifest.</p>';
        }

        // Re-attach event listeners for new message buttons
        userListDiv.querySelectorAll('.message-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const username = event.currentTarget.dataset.username;
                console.log(`[activeUsers.js] Message button clicked for ${username}`);
                if (window.MLNF && window.MLNF.openMessageModal) {
                    window.MLNF.openMessageModal(username);
                } else {
                    console.error(`[activeUsers.js] MLNF.openMessageModal function not found for user ${username}.`);
                }
            });
        });
        console.log('[activeUsers.js] User list populated with fetched data.');

    } catch (error) {
        console.error('[activeUsers.js] Error populating active users list:', error);
        if (userListDiv) { // Check again as it might be null if error is early
            userListDiv.innerHTML = '<p class="error-users">Could not summon souls. The aether is disturbed.</p>';
        }
    }
}

function updateActiveUsersButtonVisibility() {
    const showUsersBtn = document.getElementById('showUsersBtn');
    if (!showUsersBtn) {
        console.warn('[activeUsers.js] #showUsersBtn not found for visibility update.');
        return;
    }

    const token = localStorage.getItem('sessionToken');
    if (token) {
        showUsersBtn.style.display = 'flex'; // Or 'block', match CSS
        console.log('[activeUsers.js] User logged in, #showUsersBtn is visible.');
    } else {
        showUsersBtn.style.display = 'none';
        console.log('[activeUsers.js] User logged out, #showUsersBtn is hidden.');
    }
}

function initActiveUsers() {
    injectActiveUsersSidebar();
    setupActiveUsersEvents();
    updateActiveUsersButtonVisibility(); // Call the new function here
    // Note: Population of user list is called within setupActiveUsersEvents for now
}

// Expose to global MLNF object
window.MLNF = window.MLNF || {};
window.MLNF.initActiveUsers = initActiveUsers;
window.MLNF.updateActiveUsersButtonVisibility = updateActiveUsersButtonVisibility; // Expose if needed by userMenu.js on login/logout

// This component assumes its main HTML structures (#activeUsers sidebar, #showUsersBtn button)
// are already present in the main HTML file (e.g., index.html).
// It primarily adds the overlay and event behaviors. 