// DEPLOYMENT TEST V5 - DATE: [Current Date/Time]
// Function definitions: setSoulModalView, openSoulModal, closeSoulModal, createParticle, fetchCurrentUser, fetchOnlineUsers, openMessageModal, loadMessages, checkToken, logout, updateAuthUI - ALL DEFINED BEFORE DOMContentLoaded

// Global-like variables for DOM elements accessed by global functions - assigned in DOMContentLoaded
let soulModal, soulModalTitle, soulLoginForm, soulModalSubmit, modalFeedback, confirmPasswordField, modalToggleView;
let activeUsers; // Used by logout()
let messageModal, recipientName, messageHistory, messageInput; // Used by openMessageModal, loadMessages

// HTML snippets for toggling views - define them early
const switchToRegisterLinkHTML = 'New to the Sanctuary? <a href="#" id="switchToRegisterLink">Claim Your Immortality</a>';
const switchToLoginLinkHTML = 'Already an Immortal? <a href="#" id="switchToLoginLink">Enter Now</a>';

// Backend API URL (Restored)
const API_URL = 'https://mlnf-auth.onrender.com/api';

// Mocking infrastructure for local testing
window.MOCK_LOGGED_IN_STATE = false;

function enableMockLogin() {
    window.MOCK_LOGGED_IN_STATE = true;
    console.log('%cMock login ENABLED. Call updateAuthUIAndFetchUsers() to refresh UI.', 'color: green; font-weight: bold; font-size: 1.2em;');
    // Attempt to refresh UI if possible
    if (typeof updateAuthUIAndFetchUsers === 'function') {
        updateAuthUIAndFetchUsers();
    }
}

function disableMockLogin() {
    window.MOCK_LOGGED_IN_STATE = false;
    console.log('%cMock login DISABLED. Real authentication will be used. Call updateAuthUIAndFetchUsers() to refresh UI.', 'color: red; font-weight: bold; font-size: 1.2em;');
    // Attempt to refresh UI if possible
    if (typeof updateAuthUIAndFetchUsers === 'function') {
        updateAuthUIAndFetchUsers();
    }
}

// Helper to refresh UI after toggling mock state
async function updateAuthUIAndFetchUsers() {
    if (typeof checkToken !== 'function' || typeof updateAuthUI !== 'function') {
        console.error('Required functions (checkToken, updateAuthUI) not available to refresh UI.');
        return;
    }
    const isAuthenticated = await checkToken();
    updateAuthUI(isAuthenticated);
    // If the active users sidebar is open, also refresh its content
    const activeUsersPanel = document.getElementById('activeUsers');
    if (activeUsersPanel && activeUsersPanel.classList.contains('active') && typeof fetchOnlineUsers === 'function') {
        fetchOnlineUsers();
    }
}

window.enableMockLogin = enableMockLogin;
window.disableMockLogin = disableMockLogin;
window.updateAuthUIAndFetchUsers = updateAuthUIAndFetchUsers; // Expose for convenience

// --- Reintegrated Soul Modal: Core Logic Functions ---
function setSoulModalView(mode) {
    console.log('[Reintegration] setSoulModalView called with mode:', mode);
    if (!soulModal || !soulLoginForm || !soulModalTitle || !confirmPasswordField || !soulModalSubmit || !modalToggleView) {
        console.error('[Reintegration] setSoulModalView: Crucial modal elements missing. Check declarations and IDs. soulModal:', soulModal, 'soulLoginForm:', soulLoginForm, 'soulModalTitle:', soulModalTitle, 'confirmPasswordField:', confirmPasswordField, 'soulModalSubmit:', soulModalSubmit, 'modalToggleView:', modalToggleView);
        return;
    }
    soulLoginForm.reset(); 
    if(modalFeedback) modalFeedback.textContent = '';
    soulModal.dataset.mode = mode;

    if (mode === 'register') {
        soulModalTitle.textContent = 'Claim Your Immortality';
        confirmPasswordField.style.display = 'block';
        soulModalSubmit.textContent = 'Begin Your Eternity';
        modalToggleView.innerHTML = switchToLoginLinkHTML;
    } else { // Default to login
        soulModalTitle.textContent = 'Enter the Sanctuary';
        confirmPasswordField.style.display = 'none';
        soulModalSubmit.textContent = 'Transcend';
        modalToggleView.innerHTML = switchToRegisterLinkHTML;
    }
    console.log('[Reintegration] setSoulModalView finished for mode:', mode);
}

function openSoulModal(mode = 'login') {
    console.log('[Reintegration] openSoulModal called with mode:', mode);
    if (!soulModal) {
        console.error('[Reintegration] openSoulModal: soulModal element not found!');
        return;
    }
    setSoulModalView(mode); 
    soulModal.style.display = 'flex';
    const usernameInput = soulModal.querySelector('input[name="username"]');
    if (usernameInput) usernameInput.focus(); else console.warn('[Reintegration] Username input not found in soulModal for focusing.');
    console.log('[Reintegration] soulModal display set to flex.');
}

function closeSoulModal() {
    console.log('[Reintegration] closeSoulModal called');
    if (!soulModal) {
        console.error('[Reintegration] closeSoulModal: soulModal is not defined or found!');
        return;
    }
    soulModal.style.display = 'none';
    if (modalFeedback) modalFeedback.textContent = '';
    if (soulLoginForm) soulLoginForm.reset();
    console.log('[Reintegration] soulModal display set to none.');
}

// Particles animation (Restored and defined before DOMContentLoaded)
function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.width = `${Math.random() * 8 + 4}px`;
    particle.style.height = particle.style.width;
    particle.style.background = `rgba(${Math.random() * 255}, ${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 0.7)`;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.animationDuration = `${Math.random() * 5 + 5}s`;
    console.log('[Particle] Creating particle:', particle);
    const heroSection = document.querySelector('.hero');
    console.log('[Particle] Attempting to find .hero section:', heroSection);
    if (heroSection) {
        heroSection.appendChild(particle);
    } else {
        console.log('[Particle] Hero section not found, appending particle to body.');
    document.body.appendChild(particle);
    }
    setTimeout(() => particle.remove(), 10000);
}

// Fetch current user data (Restored)
async function fetchCurrentUser() {
    if (window.MOCK_LOGGED_IN_STATE === true) {
        console.warn('[MOCK] fetchCurrentUser: Returning MOCKED user.');
        return { username: 'MockUser', displayName: 'Mock Immortal', email: 'mock@mlnf.net', avatar: 'https://i.pravatar.cc/40?u=mockuser' };
    }
    const token = localStorage.getItem('sessionToken');
    // console.log('[Reintegration] Fetching current user with token:', token ? token.substring(0, 10) + '...' : 'No token');
    if (!token) {
        // console.warn('[Reintegration] No session token found for current user');
        return null;
    }
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // console.warn('[Reintegration] Invalid or expired token for current user. Clearing session.');
                localStorage.removeItem('sessionToken');
            }
            // throw new Error(`HTTP error ${response.status}: ${response.statusText}`); // Let caller handle UI for this
            return null; 
        }
        const user = await response.json();
        // console.log('[Reintegration] Current user fetched:', user.username);
        return user;
    } catch (error) {
        console.error('[Reintegration] Fetch current user error:', error.message);
        return null;
    }
}

// Fetch online users with retry (Restored)
async function fetchOnlineUsers() {
    console.log('[Reintegration] Attempting to fetch online users.');
    const apiBaseUrl = localStorage.getItem('apiBaseUrl') || 'https://mlnf.reintegrate.ai';
    const token = localStorage.getItem('token');

    if (!token) {
        console.warn('[Reintegration] No token found, cannot fetch users.');
        updateSeekersList([]); // Show empty or logged-out state
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Reintegration] Fetch online users API error:', response.status, errorText);
            updateSeekersList({ error: `Could not summon seekers: ${response.status} ${errorText || 'Unknown error'}` });
            return;
        }

        const responseData = await response.json();
        console.log('[Reintegration] Successfully fetched raw user data:', responseData);

        const usersArray = responseData.users;

        if (!usersArray || !Array.isArray(usersArray)) {
            console.error('[Reintegration] Fetched data.users is not an array or is missing:', usersArray);
            updateSeekersList({ error: "Could not summon seekers: Invalid data format from server." });
            return;
        }
        
        console.log('[Reintegration] Parsed users array:', usersArray);
        updateSeekersList(usersArray);

    } catch (error) {
        console.error('[Reintegration] Fetch online users API error:', error);
        updateSeekersList({ error: "Could not summon seekers: Network issue or API down." });
    }
}

function updateSeekersList(users) {
    const seekersList = document.getElementById('seekersList');
    const seekersLoading = document.getElementById('seekersLoading');
    const seekersError = document.getElementById('seekersError');

    if (!seekersList || !seekersLoading || !seekersError) {
        console.error('[Reintegration] Seekers list UI elements not found.');
        return;
    }

    seekersLoading.style.display = 'none';
    seekersError.textContent = ''; // Clear previous errors

    if (users.error) {
        seekersError.textContent = users.error;
        seekersList.innerHTML = ''; // Clear list on error
        console.log('[Reintegration] Displaying error:', users.error)
        return;
    }

    if (!Array.isArray(users)) {
        console.error('[Reintegration] updateSeekersList received non-array users (and not an error object):', users);
        seekersError.textContent = 'Unexpected data received for user list.';
        seekersList.innerHTML = '';
        return;
    }
    
    console.log('[Reintegration] Updating seekers list with users:', users);

    if (users.length === 0) {
        seekersList.innerHTML = '<li class="list-group-item text-muted">No souls are currently adrift...</li>';
        return;
    }

    seekersList.innerHTML = users.map(user => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <img src="${user.avatar_url || 'assets/images/default-avatar.png'}" alt="${user.username}" class="seeker-avatar mr-2">
                <span class="seeker-name">${user.username}</span>
            </div>
            <span class="badge badge-primary badge-pill">${user.realm || 'Unknown Realm'}</span>
        </li>
    `).join('');
}

// Messaging modal functions (Restored)
async function openMessageModal(username) {
    console.log(`[MOCK DEBUG] openMessageModal called for ${username}. MOCK_LOGGED_IN_STATE before checkToken: ${window.MOCK_LOGGED_IN_STATE}`);
    const isAuthenticated = await checkToken();
    console.log(`[MOCK DEBUG] openMessageModal: isAuthenticated result from checkToken: ${isAuthenticated}`);

    if (!isAuthenticated) {
        console.warn('[MOCK DEBUG] openMessageModal: User NOT authenticated according to checkToken. Opening Soul Modal for login.');
        if (typeof openSoulModal === 'function') {
            openSoulModal('login');
        } else {
            console.error('openSoulModal function is not defined. Cannot redirect to login.');
        }
        return;
    } else {
        console.log('[MOCK DEBUG] openMessageModal: User IS authenticated. Proceeding to open message modal.');
    }

    // Proceed with opening the message modal if authenticated
    if (!messageModal || !recipientName || !messageHistory) {
        console.error('[Reintegration] Message modal elements not found for openMessageModal.');
        return;
    }
    recipientName.textContent = username;
    messageHistory.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
    messageModal.style.display = 'block';
    loadMessages(username);
}

async function loadMessages(recipient) {
    if (!messageHistory) return;
    // Placeholder for actual message fetching logic
    messageHistory.innerHTML = `
        <div class="message-bubble received">
            Greetings, ${recipient}! (Test) <small>${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="message-bubble sent">
            Hail! (Test) <small>${new Date().toLocaleTimeString()}</small>
        </div>
    `;
}

// Token validation (Restored)
async function checkToken() {
    console.log(`[MOCK DEBUG] checkToken started. Current MOCK_LOGGED_IN_STATE: ${window.MOCK_LOGGED_IN_STATE}`);
    if (window.MOCK_LOGGED_IN_STATE === true) {
        console.warn('[MOCK DEBUG] checkToken: Mocking as TRUE. Returning true.');
        return true;
    }
    console.log('[Reintegration Stage X] checkToken initiated for real token check.');
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        console.warn('[Reintegration Stage X] checkToken: No session token found');
        return false;
    }
    const user = await fetchCurrentUser(); 
    if (user) {
        console.log('[Reintegration Stage X] checkToken: Token is valid, user authenticated.');
        return true;
    }
    // Correctly scoped fallback for invalid token / user fetch failure
    console.warn('[Reintegration Stage X] checkToken: Token validation failed or user not fetched. Clearing session.');
    localStorage.removeItem('sessionToken');
    return false;
}

// Logout function (Restored)
async function logout() {
    const token = localStorage.getItem('sessionToken');
    console.log('[Reintegration Stage X] User logout initiated.');

    if (token) {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                console.log('[Reintegration Stage X] Backend logout successful:', result.message);
            } else {
                const errorResult = await response.text();
                console.warn(`[Reintegration Stage X] Backend logout failed. Status: ${response.status}, Message: ${errorResult}`);
            }
        } catch (error) {
            console.error('[Reintegration Stage X] Error during backend logout API call:', error);
        }
    }

    localStorage.removeItem('sessionToken');
    console.log('[Reintegration Stage X] Session token removed from client.');
    
    updateAuthUI(false); 
    if (activeUsers && activeUsers.classList.contains('active')) {
        activeUsers.classList.remove('active');
        const userList = document.getElementById('userList');
        if(userList) userList.innerHTML = '<p class="modal-error">Sanctuary access required. Please enter.</p>';
    }
}

// Update auth UI elements (Restored & Modified to use openSoulModal)
async function updateAuthUI(isAuthenticated) {
    console.log('[Reintegration Stage X] Updating auth UI, authenticated:', isAuthenticated);
    const authButtonsDiv = document.querySelector('.auth-buttons'); 
    const soulButtonHeader = document.getElementById('soulButton'); 
    const headerRegisterButton = document.getElementById('headerRegisterButton');
    const userMenu = document.getElementById('userMenu');
    const heroSignupButton = document.getElementById('heroSignupButton');
    const heroLoginButton = document.getElementById('heroLoginButton');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const registerLink = document.getElementById('registerLink');

    if (isAuthenticated) {
        console.log('[AuthUI] User IS authenticated. Updating UI for logged-in state.');
        if (authButtonsDiv) authButtonsDiv.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'inline-block'; 
            console.log('[AuthUI] userMenu display set to inline-block.');
        } else {
            console.warn('[AuthUI] userMenu element NOT found.');
        }
        
        const userMenuAvatar = document.getElementById('userMenuAvatar');
        console.log('[AuthUI] userMenuAvatar element:', userMenuAvatar);

        const user = await fetchCurrentUser(); 
        console.log('[AuthUI] fetchCurrentUser result:', user);

        if (user) {
            console.log('[AuthUI] User object fetched:', JSON.stringify(user));
            if (usernameDisplay) {
                usernameDisplay.textContent = user.username || 'Immortal';
                console.log('[AuthUI] usernameDisplay updated to:', usernameDisplay.textContent);
            } else {
                console.warn('[AuthUI] usernameDisplay element NOT found.');
            }

            if (userMenuAvatar) { 
                const avatarUrlToSet = user.avatar || 'assets/default.jpg';
                console.log(`[AuthUI] Attempting to set avatar. User avatar: ${user.avatar}, Fallback: assets/default.jpg. Effective URL: ${avatarUrlToSet}`);
                userMenuAvatar.src = avatarUrlToSet; 
                userMenuAvatar.alt = user.username ? `${user.username}'s avatar` : 'User Avatar';
                userMenuAvatar.style.display = 'inline'; 
                console.log('[AuthUI] userMenuAvatar src set to:', userMenuAvatar.src, 'alt to:', userMenuAvatar.alt);
            } else {
                console.warn('[AuthUI] userMenuAvatar element NOT found when trying to set user-specific avatar.');
            }
        } else { // User fetch failed or no user data, but still authenticated (e.g. token valid but /me fails)
            console.warn('[AuthUI] fetchCurrentUser returned null/false, but isAuthenticated is true. Using default display.');
            if (usernameDisplay) {
                usernameDisplay.textContent = 'Immortal'; 
                console.log('[AuthUI] usernameDisplay set to default "Immortal".');
            }
            if (userMenuAvatar) {
                console.log('[AuthUI] Attempting to set default avatar because user object is null.');
                userMenuAvatar.src = 'assets/default.jpg';
                userMenuAvatar.alt = 'User Avatar';
                userMenuAvatar.style.display = 'inline';
                console.log('[AuthUI] userMenuAvatar src set to default:', userMenuAvatar.src);
            } else {
                console.warn('[AuthUI] userMenuAvatar element NOT found when trying to set default avatar.');
            }
        }
        if (heroSignupButton) {
            heroSignupButton.textContent = 'Eternal Hearth';
            heroSignupButton.href = 'lander.html';
            heroSignupButton.onclick = null; 
        }
        if (heroLoginButton) {
            heroLoginButton.textContent = 'My Soul';
            heroLoginButton.href = 'pages/profiles.html';
            heroLoginButton.onclick = null; 
        }
        if (activeUsers && activeUsers.classList.contains('active')) {
            fetchOnlineUsers(); 
        }
    } else { 
        if (authButtonsDiv) authButtonsDiv.style.display = 'block'; 
        if (userMenu) userMenu.style.display = 'none';
        if (soulButtonHeader) {
            const iconElement = soulButtonHeader.querySelector('.icon');
            const labelElement = soulButtonHeader.querySelector('.label');
            if (iconElement) iconElement.innerHTML = '👻'; 
            if (labelElement) labelElement.textContent = 'Enter The Sanctuary';
        }
        if (headerRegisterButton) {
            headerRegisterButton.style.display = 'inline-flex';
        }
        if (heroSignupButton) {
            heroSignupButton.textContent = 'Embrace Immortality';
            heroSignupButton.href = '#'; 
            heroSignupButton.onclick = (e) => { e.preventDefault(); openSoulModal('register'); };
        }
        if (heroLoginButton) {
            heroLoginButton.textContent = 'Enter The Sanctuary';
            heroLoginButton.href = '#'; 
            heroLoginButton.onclick = (e) => { e.preventDefault(); openSoulModal('login'); };
        }
    }
    console.log('[Reintegration Stage X] updateAuthUI finished.');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Debug Step] DOMContentLoaded fired.');

    // 1. Assign ALL DOM elements FIRST
    // Variables for global functions (assigned here)
    soulModal = document.getElementById('soulModal');
    soulModalTitle = document.getElementById('soulModalTitle');
    soulLoginForm = document.getElementById('soulLoginForm');
    soulModalSubmit = document.getElementById('soulModalSubmit');
    modalFeedback = document.getElementById('modalFeedback');
    confirmPasswordField = document.getElementById('confirmPasswordField');
    modalToggleView = document.getElementById('modalToggleView');
    console.log('[Debug Step] soulModal assigned:', soulModal, 'modalToggleView assigned:', modalToggleView);
    
    activeUsers = document.getElementById('activeUsers'); // For logout()
    
    messageModal = document.getElementById('messageModal'); // For openMessageModal etc.
    recipientName = document.getElementById('recipientName');
    messageHistory = document.getElementById('messageHistory');
    messageInput = document.getElementById('messageInput');

    // Variables scoped to DOMContentLoaded
    const showUsersBtn = document.getElementById('showUsersBtn');
    const closeUsers = document.getElementById('closeUsers');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const closeMessageModalBtn = document.getElementById('closeMessageModal');
    const themeToggle = document.getElementById('themeToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    const headerSoulButton = document.getElementById('soulButton'); 
    const headerRegisterButton = document.getElementById('headerRegisterButton');
    console.log('[Debug Step] headerSoulButton assigned:', headerSoulButton);
    console.log('[Debug Step] headerRegisterButton assigned:', headerRegisterButton);
    const userMenu = document.getElementById('userMenu');
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    const logoutLink = document.getElementById('logoutLink');

    // 2. Attach Core Modal Event Listeners
    if (soulModal) {
        const modalCloseXButton = soulModal.querySelector('.close-modal');
        console.log('[Debug Step] Modal X button element:', modalCloseXButton);
        if (modalCloseXButton) {
            modalCloseXButton.addEventListener('click', closeSoulModal);
            console.log('[Debug Step] Listener for modal X button ATTACHED.');
        }
        soulModal.addEventListener('click', (event) => {
            if (event.target === soulModal) closeSoulModal();
        });
        console.log('[Debug Step] Listener for modal outside click ATTACHED.');
    } else {
        console.error('[Debug Step] soulModal not found! Cannot attach close listeners.');
    }

    if (modalToggleView) {
        modalToggleView.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                console.log('[Debug Step] Modal toggle link clicked:', event.target.id);
                if (event.target.id === 'switchToRegisterLink') {
                    setSoulModalView('register');
                } else if (event.target.id === 'switchToLoginLink') {
                    setSoulModalView('login');
                }
            }
        });
        console.log('[Debug Step] Listener for modal view toggle ATTACHED.');
    } else {
        console.error('[Debug Step] modalToggleView not found! Cannot attach view toggle listener.');
    }

    // 3. Attach Header soulButton Listener
    if (headerSoulButton) {
        headerSoulButton.addEventListener('click', async () => {
            console.log('[Debug Step] Header soulButton clicked.');
            const isAuthenticated = await checkToken();
            if (!isAuthenticated) { 
                 console.log('[Debug Step] soulButton: User NOT authenticated by checkToken. Opening login modal.');
                 openSoulModal('login');
            } else {
                console.log('[Debug Step] soulButton: User IS authenticated by checkToken. Toggling dropdown.');
                if(userDropdown) userDropdown.classList.toggle('active'); 
            }
        });
        console.log('[Debug Step] Listener for header soulButton ATTACHED.');
    } else {
        console.error('[Debug Step] Header soulButton (id: soulButton) not found!');
    }

    // USER MENU BUTTON LISTENER (for when user is logged IN)
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling up if not needed
            console.log('[Debug Step] userMenuButton clicked.');
            userDropdown.classList.toggle('active');
        });
        console.log('[Debug Step] Listener for userMenuButton ATTACHED.');

        // Optional: Close dropdown if clicking outside of it
        document.addEventListener('click', (e) => {
            if (userMenu && !userMenu.contains(e.target) && userDropdown.classList.contains('active')) {
                console.log('[Debug Step] Clicked outside user menu, closing dropdown.');
                userDropdown.classList.remove('active');
            }
        });
    } else {
        console.error('[Debug Step] userMenuButton or userDropdown not found! Cannot attach listener.');
    }

    // 3b. Attach Header headerRegisterButton Listener
    if (headerRegisterButton) {
        headerRegisterButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Debug Step] Header headerRegisterButton clicked.');
            if (!localStorage.getItem('sessionToken')) { 
                 openSoulModal('register');
            } else {
                console.log('[Debug Step] Header headerRegisterButton clicked while logged in, redirecting to profile.');
                window.location.href = 'pages/profiles.html';
            }
        });
        console.log('[Debug Step] Listener for header headerRegisterButton ATTACHED.');
    } else {
        console.error('[Debug Step] Header headerRegisterButton (id: headerRegisterButton) not found!');
    }

    // 4. Theme Toggle Logic
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            if(themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.classList.remove('light-theme');
            if(themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // 5. Mobile Menu
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }
    
    // Set initial modal state but do not show it.
    if (soulModal) setSoulModalView('login');

    // ADDED SIDEBAR EVENT LISTENERS (MOVED HERE FOR CORRECT SCOPE)
    if (showUsersBtn && activeUsers) {
        showUsersBtn.addEventListener('click', async () => {
            console.log('[Reintegration Stage Y] Show Users button clicked.');
            const isAuthenticated = await checkToken();
            if (isAuthenticated) {
                activeUsers.classList.add('active');
                fetchOnlineUsers();
            } else {
                console.log('[Show Users DEBUG] User not authenticated via checkToken, opening soul modal.');
                openSoulModal('login');
                const userList = document.getElementById('userList');
                if(userList) userList.innerHTML = '<p class="modal-error">Please log in to view active users.</p>';
            }
        });
    }
    if (closeUsers && activeUsers) {
        closeUsers.addEventListener('click', () => {
            activeUsers.classList.remove('active');
        });
    }

    // Expose openSoulModal for console testing
    window.openSoulModal = openSoulModal;
    console.log('[Debug Step] DOMContentLoaded finished. window.openSoulModal available.');

    // RE-ACTIVATING PARTICLE CREATION - NOW WITH CONTINUOUS GENERATION
    // Initial burst of particles
    for(let i=0; i<10; i++) createParticle(); 
    // Continuously create new particles
    setInterval(createParticle, 500); // Create a new particle every 500ms
    console.log('[Debug Step] Continuous particle creation initiated after DOMContentLoaded.');

    // MESSAGE MODAL CLOSE LISTENERS
    console.log('[MSG MODAL DEBUG] Attempting to attach close listeners.');
    console.log('[MSG MODAL DEBUG] closeMessageModalBtn:', closeMessageModalBtn);
    console.log('[MSG MODAL DEBUG] messageModal:', messageModal);
    if (closeMessageModalBtn && messageModal) {
        closeMessageModalBtn.addEventListener('click', () => {
            console.log(`[MSG MODAL DEBUG] 'Close Nexus' button CLICKED.`);
            messageModal.style.display = 'none';
            console.log('[Messaging] Message modal closed via Close Nexus button.');
        });
        console.log('[Debug Step] Listener for message modal Close button ATTACHED.');
    } else {
        console.error('[MSG MODAL DEBUG] Could not attach listener to Close Nexus button.');
        console.error('[MSG MODAL DEBUG] Button:', closeMessageModalBtn);
        console.error('[MSG MODAL DEBUG] Modal:', messageModal);
    }

    if (messageModal) {
        messageModal.addEventListener('click', (event) => {
            console.log('[MSG MODAL DEBUG] Backdrop area CLICKED.');
            console.log('[MSG MODAL DEBUG] event.target:', event.target);
            console.log('[MSG MODAL DEBUG] expected_messageModal_backdrop:', messageModal);
            if (event.target === messageModal) { // Click was directly on the backdrop
                messageModal.style.display = 'none';
                console.log('[Messaging] Message modal closed via backdrop click.');
            } else {
                console.log('[MSG MODAL DEBUG] Click was inside modal content, not on backdrop.');
            }
        });
        console.log('[Debug Step] Listener for message modal outside click ATTACHED.');
    } else {
        console.error('[MSG MODAL DEBUG] Could not attach backdrop click listener. messageModal missing.');
    }

    // SEND MESSAGE BUTTON LISTENER (Uses sendMessageBtn declared earlier in DOMContentLoaded)
    console.log('[MSG MODAL DEBUG] sendMessageBtn element check:', sendMessageBtn);
    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', () => {
            console.log(`[MSG MODAL DEBUG] 'Send Whisper' button CLICKED. Value: ${messageInput.value}`);
            if(messageInput) messageInput.value = ''; 
        });
        console.log('[Debug Step] Listener for sendMessageBtn ATTACHED.');
    } else {
        console.error('[MSG MODAL DEBUG] Could not attach listener to Send Whisper button.');
        console.error('[MSG MODAL DEBUG] Button:', sendMessageBtn);
        console.error('[MSG MODAL DEBUG] Input:', messageInput);
    }

    // Soul Modal Form Submission Logic - NOW ACTIVATED
    if (soulLoginForm && soulModal) { 
        soulLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!modalFeedback) {
                console.error('modalFeedback element not found for displaying messages.');
                return;
            }
            modalFeedback.textContent = ''; // Clear previous feedback

            const username = soulLoginForm.username.value.trim();
            const password = soulLoginForm.password.value;
            const mode = soulModal.dataset.mode || 'login'; // 'login' or 'register'

            if (!username || !password) {
                modalFeedback.textContent = 'Soul Identifier and Ethereal Key are required.';
                return;
            }

            let url = '';
            let payload = { username, password };

            if (mode === 'register') {
                const confirmPassword = soulLoginForm.confirmPassword.value;
                if (password !== confirmPassword) {
                    modalFeedback.textContent = 'Ethereal Keys do not align.';
                    return;
                }
                url = `${API_URL}/auth/register`;
            } else {
                url = `${API_URL}/auth/login`;
            }

            soulModalSubmit.disabled = true;
            soulModalSubmit.textContent = mode === 'register' ? 'Forging...' : 'Transcending...';

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    modalFeedback.textContent = data.message || `Error: ${response.status} - ${response.statusText}`;
                    throw new Error(data.message || `HTTP error ${response.status}`);
                }

                if (mode === 'login') {
                    if (data.token) {
                        localStorage.setItem('sessionToken', data.token);
                        modalFeedback.textContent = 'Sanctuary access granted. The gateway opens...';
                        await updateAuthUI(true);
                        setTimeout(() => {
                            closeSoulModal();
                             // Optionally, refresh online users if sidebar was open or redirect
                            if (activeUsers && activeUsers.classList.contains('active')) {
                                fetchOnlineUsers();
                            }
                        }, 1500); 
                    } else {
                        modalFeedback.textContent = 'Token not received. Entry denied.';
                    }
                } else { // Register
                    modalFeedback.textContent = data.message || 'Eternity claimed! Please enter the Sanctuary now.';
                    // Optionally switch to login view or auto-login
                    setTimeout(() => {
                        setSoulModalView('login'); // Switch to login view
                    }, 2000);
                }

            } catch (error) {
                console.error(`[Auth Form Error - ${mode}]:`, error);
                if (!modalFeedback.textContent) { // Avoid overwriting specific backend error
                    modalFeedback.textContent = 'An unexpected disturbance occurred. Try again.';
                }
            } finally {
                soulModalSubmit.disabled = false;
                soulModalSubmit.textContent = mode === 'register' ? 'Begin Your Eternity' : 'Transcend';
            }
        }); 
        console.log('[Reintegration] Soul Modal form submission listener ATTACHED.');
    } else {
        console.error('[Reintegration] Could not attach soul modal form listener. soulLoginForm or soulModal not found.');
    }

    // Initial auth state check and UI update - MOVED INSIDE DOMContentLoaded
    (async () => {
        try {
            console.log('[Reintegration] Performing initial authentication check (from within DOMContentLoaded)...');
            const isAuthenticated = await checkToken();
            console.log('[Reintegration] Initial isAuthenticated status:', isAuthenticated);
            // Pass the already queried DOM elements if they are needed and might not be found by getElementById within updateAuthUI immediately
            await updateAuthUI(isAuthenticated); // updateAuthUI should reliably find elements now
            
            if (soulModal && !isAuthenticated) {
                setSoulModalView('login'); 
            }
            console.log('[Reintegration] Initial UI update complete (from within DOMContentLoaded).');
        } catch (error) {
            console.error("[Reintegration] Error during initial checkToken/updateAuthUI (from DOMContentLoaded):", error);
            await updateAuthUI(false); 
            if (soulModal) {
                setSoulModalView('login');
            }
        }
    })();

});

// Sidebar, Message Modal, User Menu, Logout Link listeners.
// showUsersBtn and closeUsers listeners were moved into DOMContentLoaded and activated.
// The rest remain here, commented:
/*
if (sendMessageBtn && messageInput) { ... }
if (closeMessageModalBtn && messageModal) { ... }
if (userMenuButton && userDropdown) { ... }
if (logoutLink) { ... }
*/

// Particles - REMAINS COMMENTED OUT FOR NOW
// for(let i=0; i<15; i++) createParticle(); 

// console.log('[Reintegration Stage X] End of DOMContentLoaded setup.');