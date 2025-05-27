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
            console.log('[activeUsers.js] Overlay element after activation:', activeUsersOverlay);
            console.log('[activeUsers.js] Overlay computed styles:', {
                display: getComputedStyle(activeUsersOverlay).display,
                opacity: getComputedStyle(activeUsersOverlay).opacity,
                zIndex: getComputedStyle(activeUsersOverlay).zIndex,
                pointerEvents: getComputedStyle(activeUsersOverlay).pointerEvents
            });
            setTimeout(() => {
                const rect = activeUsersSidebar.getBoundingClientRect();
                const compRight = getComputedStyle(activeUsersSidebar).right;
                const overlayOpacity = getComputedStyle(activeUsersOverlay).opacity;
                console.log('[activeUsers.js] Sidebar bounding rect after activation:', rect);
                console.log('[activeUsers.js] Computed right style:', compRight);
                console.log('[activeUsers.js] Overlay opacity after transition:', overlayOpacity);
                
                if (compRight === '-320px') {
                    console.warn('[activeUsers.js] Sidebar still off-screen after activation; applying inline fallback.');
                    activeUsersSidebar.style.right = '0px'; // Fallback
                }
                
                if (overlayOpacity === '0') {
                    console.warn('[activeUsers.js] Overlay still invisible after activation; applying inline fallback.');
                    activeUsersOverlay.style.opacity = '1'; // Fallback
                }
            }, 350); // wait for transition
            document.body.style.overflow = 'hidden';
        });

        // Fix: Always close sidebar on overlay or X click
        let isClosing = false; // Prevent multiple rapid calls
        const closeActiveSidebar = (event) => {
            if (isClosing) {
                console.log('[activeUsers.js] closeActiveSidebar: Already closing (isClosing=true), ignoring duplicate call. Event target:', event?.target, 'Current target:', event?.currentTarget);
                return;
            }
            isClosing = true;
            
            console.log('[activeUsers.js] closeActiveSidebar: Starting (isClosing set to true). Event target:', event?.target, 'Current target:', event?.currentTarget);
            console.log('[activeUsers.js] closeActiveSidebar: Initial sidebar style.right:', activeUsersSidebar.style.right);
            console.log('[activeUsers.js] closeActiveSidebar: Initial sidebar classes:', activeUsersSidebar.className);
            console.log('[activeUsers.js] closeActiveSidebar: Initial overlay classes:', activeUsersOverlay.className);

            // Check elements just before classList manipulation
            console.log('[activeUsers.js] closeActiveSidebar: Checking activeUsersSidebar. Type:', typeof activeUsersSidebar, 'Value:', activeUsersSidebar);
            
            console.log('[activeUsers.js] closeActiveSidebar: About to check activeUsersOverlay...');
            console.log('[activeUsers.js] closeActiveSidebar: activeUsersOverlay variable type:', typeof activeUsersOverlay);
            
            if (activeUsersOverlay) {
                console.log('[activeUsers.js] closeActiveSidebar: activeUsersOverlay exists, getting its properties...');
                try {
                    console.log('[activeUsers.js] closeActiveSidebar: activeUsersOverlay.id:', activeUsersOverlay.id);
                    console.log('[activeUsers.js] closeActiveSidebar: activeUsersOverlay.className:', activeUsersOverlay.className);
                    console.log('[activeUsers.js] closeActiveSidebar: Checking activeUsersOverlay. Type: object Value:', activeUsersOverlay);
                } catch (overlayError) {
                    console.error('[activeUsers.js] closeActiveSidebar: Error accessing activeUsersOverlay properties:', overlayError);
                }
            } else {
                console.error('[activeUsers.js] closeActiveSidebar: activeUsersOverlay is null/undefined!');
                console.log('[activeUsers.js] closeActiveSidebar: Trying to re-find overlay by ID...');
                const refoundOverlay = document.getElementById('activeUsersOverlay');
                console.log('[activeUsers.js] closeActiveSidebar: Re-found overlay:', refoundOverlay);
            }

            // Remove 'active' class first to remove !important overrides
            if (activeUsersSidebar) {
                activeUsersSidebar.classList.remove('active');
            } else {
                console.error('[activeUsers.js] closeActiveSidebar: activeUsersSidebar is null or undefined before classList.remove!');
            }
            
            if (activeUsersOverlay) {
                activeUsersOverlay.classList.remove('active');
            } else {
                console.error('[activeUsers.js] closeActiveSidebar: activeUsersOverlay is null or undefined before classList.remove!');
            }
            
            console.log('[activeUsers.js] closeActiveSidebar: Attempted to remove "active" classes.'); // Changed log message slightly
            console.log('[activeUsers.js] closeActiveSidebar: Sidebar classes after remove:', activeUsersSidebar ? activeUsersSidebar.className : 'Sidebar N/A');
            
            try {
                console.log('[activeUsers.js] closeActiveSidebar: About to log overlay classes...');
                console.log('[activeUsers.js] closeActiveSidebar: Overlay classes after remove:', activeUsersOverlay ? activeUsersOverlay.className : 'Overlay N/A');
                console.log('[activeUsers.js] closeActiveSidebar: About to log sidebar style.right...');
                console.log('[activeUsers.js] closeActiveSidebar: Sidebar style.right after class removal:', activeUsersSidebar.style.right);
                console.log('[activeUsers.js] closeActiveSidebar: Successfully logged all post-removal info.');
            } catch (error) {
                console.error('[activeUsers.js] closeActiveSidebar: ERROR in post-removal logging:', error);
                console.error('[activeUsers.js] closeActiveSidebar: activeUsersOverlay type:', typeof activeUsersOverlay);
                console.error('[activeUsers.js] closeActiveSidebar: activeUsersSidebar type:', typeof activeUsersSidebar);
                return; // Exit early if there's an error
            }

            // Now that 'active' (and its !important rules) are gone,
            // set the target styles to trigger transitions.
            activeUsersSidebar.classList.add('force-close'); // Use CSS class instead of inline style
            activeUsersOverlay.style.opacity = '0'; // Ensure overlay fades out
            
            console.log('[activeUsers.js] closeActiveSidebar: Added force-close class and set overlay opacity to 0.');
            console.log('[activeUsers.js] closeActiveSidebar: Sidebar classes now:', activeUsersSidebar.className);

            // Force reflow to ensure styles are applied before getComputedStyle and transition
            if (activeUsersSidebar) { 
                const forceReflow = activeUsersSidebar.offsetHeight; // Reading offsetHeight can trigger reflow
                console.log('[activeUsers.js] closeActiveSidebar: Forced reflow via offsetHeight.');
            }
            
            // Log computed styles immediately after setting them
            let computedSidebarRight = getComputedStyle(activeUsersSidebar).right;
            let computedOverlayOpacity = getComputedStyle(activeUsersOverlay).opacity;
            console.log('[activeUsers.js] closeActiveSidebar: Computed sidebar right after force-close class:', computedSidebarRight);
            console.log('[activeUsers.js] closeActiveSidebar: Computed overlay opacity after inline set:', computedOverlayOpacity);

            document.body.style.overflow = '';
            
            console.log('[activeUsers.js] closeActiveSidebar: Setting 350ms timeout for style cleanup.');
            setTimeout(() => {
                console.log('[activeUsers.js] closeActiveSidebar (timeout): Started.');
                console.log('[activeUsers.js] closeActiveSidebar (timeout): Sidebar classes before cleanup:', activeUsersSidebar.className);
                console.log('[activeUsers.js] closeActiveSidebar (timeout): Overlay classes before cleanup:', activeUsersOverlay.className);
                
                activeUsersSidebar.classList.remove('force-close'); // Remove the force-close class
                activeUsersOverlay.style.opacity = ''; // Let CSS class .active-users-overlay take over for opacity
                
                console.log('[activeUsers.js] closeActiveSidebar (timeout): Removed force-close class and cleared overlay opacity.');
                console.log('[activeUsers.js] closeActiveSidebar (timeout): Sidebar classes after cleanup:', activeUsersSidebar.className);
                console.log('[activeUsers.js] closeActiveSidebar (timeout): Overlay style.opacity after clearing:', activeUsersOverlay.style.opacity);
                isClosing = false;
                console.log('[activeUsers.js] closeActiveSidebar (timeout): isClosing set to false. Finished.');
            }, 350); // Match CSS transition duration (0.3s)
        };

        if (closeUsersBtn) {
            // Remove any existing handlers to prevent duplicates
            closeUsersBtn.onclick = null;
            closeUsersBtn.onclick = closeActiveSidebar;
            console.log('[activeUsers.js] Close button click handler attached');
        } else {
            console.warn('[activeUsers.js] Close button (#closeUsers) not found inside sidebar.');
        }
        // Remove any existing handlers to prevent duplicates
        activeUsersOverlay.onclick = null;
        activeUsersOverlay.onclick = closeActiveSidebar;
        console.log('[activeUsers.js] Overlay click handler attached to:', activeUsersOverlay);

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