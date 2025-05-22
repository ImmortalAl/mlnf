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
            console.log('[activeUsers.js] showUsersBtn clicked.');
            activeUsersSidebar.classList.add('active');
            activeUsersOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeActiveSidebar = () => {
            console.log('[activeUsers.js] closeActiveSidebar called.');
            activeUsersSidebar.classList.remove('active');
            activeUsersOverlay.classList.remove('active');
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

function populateActiveUsersList() {
    const userListDiv = document.getElementById('userList');
    if (!userListDiv) {
        console.warn('[activeUsers.js] userList div not found.');
        return;
    }

    // Mock data for now - replace with actual data fetching later
    const users = [
        { name: 'EternalSeeker', status: 'Online', avatar: window.MLNF_CONFIG?.DEFAULT_AVATAR || 'assets/images/default.jpg' },
        { name: 'CosmicWanderer', status: 'Online', avatar: window.MLNF_CONFIG?.DEFAULT_AVATAR || 'assets/images/default.jpg' },
        { name: 'LightBearer', status: 'Away', avatar: window.MLNF_CONFIG?.DEFAULT_AVATAR || 'assets/images/default.jpg' }
    ];

    userListDiv.innerHTML = users.map(user => `
        <div class="user-item">
            <img src="${user.avatar}" alt="${user.name}">
            <div class="user-info">
                <h4>${user.name}</h4>
                <span class="status ${user.status.toLowerCase()}">${user.status}</span>
            </div>
            <button class="message-btn" data-username="${user.name}" aria-label="Message ${user.name}">
                <i class="fas fa-comment"></i>
            </button>
        </div>
    `).join('');

    // Add event listeners for new message buttons
    userListDiv.querySelectorAll('.message-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const username = event.currentTarget.dataset.username;
            console.log(`[activeUsers.js] Message button clicked for ${username}`);
            // Assuming a global function or event to open message modal
            if (window.MLNF && window.MLNF.openMessageModal) {
                window.MLNF.openMessageModal(username);
            } else {
                alert(`Messaging ${username} (modal function not found).`);
            }
        });
    });
    console.log('[activeUsers.js] Mock user list populated.');
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