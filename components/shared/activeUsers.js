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
    if (activeUsersSidebar) {
        console.log('[activeUsers.js] Sidebar initial state - ID:', activeUsersSidebar.id, 'Classes:', activeUsersSidebar.className);
    }
    if (activeUsersOverlay) {
        console.log('[activeUsers.js] Overlay initial state - ID:', activeUsersOverlay.id, 'Classes:', activeUsersOverlay.className);
    }

    if (showUsersBtn && activeUsersSidebar && activeUsersOverlay) {
        showUsersBtn.addEventListener('click', () => {
            console.log('[activeUsers.js] showUsersBtn clicked.');

            // Force clear any lingering force-close class
            activeUsersSidebar.classList.remove('force-close');
            activeUsersSidebar.style.right = ''; // Clear any inline style

            // Make overlay active and show sidebar 
            activeUsersOverlay.classList.add('active');
            activeUsersSidebar.classList.add('active');

            console.log('[activeUsers.js] Applied .active to sidebar and overlay.');
            console.log('[activeUsers.js] Sidebar AFTER - ID:', activeUsersSidebar.id, 'Classes:', activeUsersSidebar.className);
            console.log('[activeUsers.js] Sidebar AFTER - Computed right:', getComputedStyle(activeUsersSidebar).right, 'Computed display:', getComputedStyle(activeUsersSidebar).display);

            if (activeUsersOverlay) {
                console.log('[activeUsers.js] Overlay AFTER - ID:', activeUsersOverlay.id, 'Classes:', activeUsersOverlay.className);
                console.log('[activeUsers.js] Overlay AFTER - Computed opacity:', getComputedStyle(activeUsersOverlay).opacity, 'Computed display:', getComputedStyle(activeUsersOverlay).display);
            }
            
            document.body.style.overflow = 'hidden';

            // Reduced timeout for quicker feedback, original fallback logic removed for now
            setTimeout(() => {
                console.log('[activeUsers.js] --- AFTER TIMEOUT (30ms) ---');
                 if (activeUsersSidebar) {
                    console.log('[activeUsers.js] Sidebar TIMEOUT - ID:', activeUsersSidebar.id, 'Classes:', activeUsersSidebar.className);
                    console.log('[activeUsers.js] Sidebar TIMEOUT - Computed right:', getComputedStyle(activeUsersSidebar).right, 'Computed display:', getComputedStyle(activeUsersSidebar).display);
                }
                if (activeUsersOverlay) {
                    console.log('[activeUsers.js] Overlay TIMEOUT - ID:', activeUsersOverlay.id, 'Classes:', activeUsersOverlay.className);
                    console.log('[activeUsers.js] Overlay TIMEOUT - Computed opacity:', getComputedStyle(activeUsersOverlay).opacity, 'Computed display:', getComputedStyle(activeUsersOverlay).display);
                }
            }, 30); 
        });

        // Prevent sidebar clicks from closing the sidebar
        activeUsersSidebar.addEventListener('click', (event) => {
            event.stopPropagation();
            console.log('[activeUsers.js] Sidebar clicked, prevented close.');
        });

        // Fix: Always close sidebar on overlay or X click
        let isClosing = false; // Prevent multiple rapid calls
        const closeActiveSidebar = (event) => {
            if (isClosing) {
                console.log('[activeUsers.js] closeActiveSidebar: Already closing, ignoring. Target:', event?.target?.id);
                return;
            }
            isClosing = true;
            
            console.log('[activeUsers.js] closeActiveSidebar: Starting. Target:', event?.target?.id);
            console.log('[activeUsers.js] Sidebar PRE-CLOSE - Classes:', activeUsersSidebar.className, 'Inline right:', activeUsersSidebar.style.right);
            console.log('[activeUsers.js] Overlay PRE-CLOSE - Classes:', activeUsersOverlay.className, 'Inline opacity:', activeUsersOverlay.style.opacity);

            activeUsersSidebar.classList.remove('active');
            activeUsersOverlay.classList.remove('active');
            console.log('[activeUsers.js] Removed .active from sidebar and overlay.');

            activeUsersSidebar.style.right = ''; // Clear any inline style from opening
            activeUsersOverlay.style.opacity = ''; // Clear any inline style from opening

            activeUsersSidebar.classList.add('force-close');
            console.log('[activeUsers.js] Added .force-close to sidebar. Sidebar classes:', activeUsersSidebar.className);

            // Force reflow
            activeUsersSidebar.offsetHeight; 
            console.log('[activeUsers.js] Sidebar POST .force-close - Computed right:', getComputedStyle(activeUsersSidebar).right);

            document.body.style.overflow = '';
            
            setTimeout(() => {
                console.log('[activeUsers.js] Close TIMEOUT: Removing .force-close.');
                activeUsersSidebar.classList.remove('force-close');
                console.log('[activeUsers.js] Close TIMEOUT: Sidebar classes final:', activeUsersSidebar.className);
                isClosing = false;
            }, 350); 
        };

        const closeUsersBtnHandler = (event) => {
            console.log('[activeUsers.js] X BUTTON CLICKED.');
            closeActiveSidebar(event); // Utilize the main closing logic
        };

        if (closeUsersBtn) {
            closeUsersBtn.onclick = null;
            closeUsersBtn.onclick = closeUsersBtnHandler;
            console.log('[activeUsers.js] Close button (X) click handler attached.');
        } else {
            console.warn('[activeUsers.js] Close button (#closeUsers) not found.');
        }
        
        activeUsersOverlay.onclick = null;
        activeUsersOverlay.onclick = closeActiveSidebar;
        console.log('[activeUsers.js] Overlay click handler attached.');

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
        // Fetch with cache-busting to ensure fresh data
        const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/online?_cb=${new Date().getTime()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch active users: ${response.status} ${response.statusText}`);
        }
        const fetchedUsers = await response.json();

        if (fetchedUsers && fetchedUsers.length > 0) {
            userListDiv.innerHTML = fetchedUsers.map(user => {
                const displayName = user.displayName || user.username || 'Unnamed Soul';
                const username = user.username || displayName; // Ensure username is available for messaging
                const avatarUrl = user.avatar || (window.MLNF_CONFIG?.DEFAULT_AVATAR || '/assets/images/default.jpg');
                // Use 'online' field from API directly.
                const isOnline = user.online === true; 
                // Use custom status if available, otherwise default
                const statusMessage = user.status && user.status.trim() !== '' ? user.status : 'Wandering the eternal realms...'; 
                const onlineClass = isOnline ? 'online' : 'offline';
                const onlineText = isOnline ? 'Online' : 'Offline';

                return `
                <div class="user-item">
                    <div class="user-avatar-wrapper">
                    <img src="${avatarUrl}" alt="${displayName}">
                        <span class="online-dot ${onlineClass}" title="${onlineText}"></span>
                    </div>
                    <div class="user-info">
                        <h4>${displayName}</h4>
                        <span class="status-message">${statusMessage}</span>
                    </div>
                    <button class="message-btn" data-username="${username}" aria-label="Message ${displayName}">
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
                event.stopPropagation(); 
                event.preventDefault(); 
                const username = event.currentTarget.dataset.username;
                console.log(`[activeUsers.js] Message button clicked for ${username}`);
                if (window.MLNF && window.MLNF.MessageModal && typeof window.MLNF.MessageModal.open === 'function') {
                    window.MLNF.MessageModal.open(username);
                } else {
                    console.error(`[activeUsers.js] MLNF.MessageModal.open function not found for user ${username}.`);
                }
            });
        });
        console.log('[activeUsers.js] User list populated with fetched data.');

    } catch (error) {
        console.error('[activeUsers.js] Error populating active users list:', error);
        if (userListDiv) { 
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
    
    // Safety check: ensure overlay isn't stuck active on page load
    const activeUsersOverlay = document.getElementById('activeUsersOverlay');
    const activeUsersSidebar = document.getElementById('activeUsers');
    if (activeUsersOverlay && activeUsersSidebar) {
        // Remove active classes if present on init
        activeUsersOverlay.classList.remove('active');
        activeUsersSidebar.classList.remove('active');
        activeUsersSidebar.classList.remove('force-close');
        // Clear any inline styles
        activeUsersOverlay.style.opacity = '';
        activeUsersOverlay.style.visibility = '';
        activeUsersOverlay.style.pointerEvents = '';
        activeUsersSidebar.style.right = '';
        console.log('[activeUsers.js] Cleared any stuck states on init');
    }
    
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