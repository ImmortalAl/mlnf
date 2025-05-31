// DEPLOYMENT TEST V5 - DATE: [Current Date/Time]
// Function definitions: setSoulModalView, openSoulModal, closeSoulModal, createParticle, fetchCurrentUser, fetchOnlineUsers, openMessageModal, loadMessages, checkToken, logout, updateAuthUI - ALL DEFINED BEFORE DOMContentLoaded

// Global-like variables for DOM elements accessed by global functions - assigned in DOMContentLoaded
let soulModal, soulModalTitle, soulLoginForm, soulModalSubmit, modalFeedback, confirmPasswordField, modalToggleView;
let activeUsers; // Used by logout()
let messageModal, recipientName, messageHistory, messageInput, currentRecipientId, currentRecipientUsername;

// HTML snippets for toggling views - define them early
const switchToRegisterLinkHTML = 'New to the Sanctuary? <a href="#" id="switchToRegisterLink">Claim Your Immortality</a>';
const switchToLoginLinkHTML = 'Already an Immortal? <a href="#" id="switchToLoginLink">Enter Now</a>';

// Backend API URL (Restored)
const API_URL = MLNF_CONFIG.API_BASE_URL;

// Mocking infrastructure for local testing
const MOCK_LOGGED_IN_STATE = localStorage.getItem('sessionToken') !== null;
window.MOCK_LOGGED_IN_STATE = MOCK_LOGGED_IN_STATE;

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
window.openMessageModal = async function(username) {
    console.log(`[MOCK DEBUG] openMessageModal called for ${username}. MOCK_LOGGED_IN_STATE before checkToken: ${window.MOCK_LOGGED_IN_STATE}`);
    const isAuthenticated = await checkToken(); 
    console.log(`[MOCK DEBUG] openMessageModal: isAuthenticated result from checkToken: ${isAuthenticated}`);

    if (!isAuthenticated) {
        console.warn('[MOCK DEBUG] openMessageModal: User NOT authenticated according to checkToken. Opening Soul Modal for login.');
        openSoulModal('login'); // Redirect to login/register if not authenticated
        return;
    }

    console.log('[MOCK DEBUG] openMessageModal: User IS authenticated. Proceeding to open message modal.');

    // Check if messageModal.js component is available
    if (window.MLNF && window.MLNF.openMessageModal && window.MLNF.initMessageModal) {
        // Use the proper messageModal.js component
        console.log('[MOCK DEBUG] Using messageModal.js component for modal handling.');
        if (!window.messageModalInitialized) {
            window.MLNF.initMessageModal();
            window.messageModalInitialized = true;
        }
        return window.MLNF.openMessageModal(username);
    }

    // Fallback to old modal system for compatibility
    if (!messageModal || !recipientName || !messageHistory || !messageInput) {
        console.error('[Reintegration] Message modal elements not found for openMessageModal.');
        alert('Message modal elements are not ready. Please try again later.');
        return;
    }
    recipientName.textContent = username;
    messageHistory.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
    
    // Use the proper .active class system instead of direct style manipulation
    messageModal.classList.add('active');
    messageModal.setAttribute('aria-hidden', 'false');
    console.log('[MOCK DEBUG] messageModal .active class added. Element:', messageModal);
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
        if (authButtonsDiv) authButtonsDiv.style.display = 'none';
        if (userMenu) userMenu.style.display = 'inline-block'; 
        
        const userMenuAvatar = document.getElementById('userMenuAvatar'); // Get it AFTER userMenu is displayed

        const user = await fetchCurrentUser(); 
        if (user) {
            if (usernameDisplay) usernameDisplay.textContent = user.username || 'Immortal';
            if (userMenuAvatar) { 
                const avatarUrlToSet = user.avatar || 'assets/images/default.jpg';
                console.log(`[AuthUI] Attempting to set avatar. User avatar: ${user.avatar}, Fallback: assets/images/default.jpg. Effective URL: ${avatarUrlToSet}`);
                userMenuAvatar.src = avatarUrlToSet; 
                userMenuAvatar.alt = user.username ? `${user.username}'s avatar` : 'User Avatar';
                userMenuAvatar.style.display = 'inline'; 
            }
        } else { // User fetch failed or no user data, but still authenticated (e.g. token valid but /me fails)
            if (usernameDisplay) usernameDisplay.textContent = 'Immortal'; 
            if (userMenuAvatar) {
                console.log('[AuthUI] Attempting to set default avatar because user object is null.');
                userMenuAvatar.src = 'assets/images/default.jpg';
                userMenuAvatar.alt = 'User Avatar';
                userMenuAvatar.style.display = 'inline';
            }
        }
        if (heroSignupButton) {
            heroSignupButton.textContent = 'Eternal Hearth';
            heroSignupButton.href = 'lander.html';
            heroSignupButton.onclick = null; 
        }
        if (heroLoginButton) {
            heroLoginButton.textContent = 'My Soul';
            heroLoginButton.href = '/profile';
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

// Helper function to check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('sessionToken');
}

// Welcome Modal for new users
function showWelcomeModal() {
    // Check if user has seen the welcome message
    const hasSeenWelcome = localStorage.getItem('mlnf_has_seen_welcome');
    
    // If user is logged in and hasn't seen the welcome message
    if (isLoggedIn() && !hasSeenWelcome) {
        const welcomeModal = document.createElement('div');
        welcomeModal.id = 'welcomeModal';
        welcomeModal.className = 'modal';
        welcomeModal.style.display = 'flex';
        
        welcomeModal.innerHTML = `
            <div class="modal-content welcome-modal-content">
                <button class="close-modal">&times;</button>
                <h2 class="welcome-title">Welcome to Manifest Liberation</h2>
                
                <div class="welcome-body">
                    <p class="welcome-intro">You've just joined a sanctuary for free thinkers where:</p>
                    
                    <div class="welcome-principles">
                        <div class="principle">
                            <i class="fas fa-infinity"></i>
                            <h3>Immortality</h3>
                            <p>Ideas endure eternally, preserved beyond the limitations of time</p>
                        </div>
                        
                        <div class="principle">
                            <i class="fas fa-lightbulb"></i>
                            <h3>Truth</h3>
                            <p>Knowledge unfettered by conventional censorship or control</p>
                        </div>
                        
                        <div class="principle">
                            <i class="fas fa-dove"></i>
                            <h3>Freedom</h3>
                            <p>Express your authentic self without fear of judgment</p>
                        </div>
                        
                        <div class="principle">
                            <i class="fas fa-users"></i>
                            <h3>Direct Democracy</h3>
                            <p>Community-driven verification where all voices matter equally</p>
                        </div>
                    </div>
                    
                    <div class="welcome-actions">
                        <button id="welcomeGetStarted" class="btn btn-primary">Get Started</button>
                        <div class="welcome-checkbox">
                            <input type="checkbox" id="dontShowAgain">
                            <label for="dontShowAgain">Don't show again</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(welcomeModal);
        
        // Style for the welcome modal
        const style = document.createElement('style');
        style.textContent = `
            .welcome-modal-content {
                max-width: 700px;
                padding: 2rem;
                background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
                border: 2px solid var(--accent);
                border-radius: var(--border-radius);
                color: var(--text);
            }
            
            .welcome-title {
                font-size: 2rem;
                text-align: center;
                margin-bottom: 1.5rem;
            }
            
            .welcome-intro {
                text-align: center;
                font-size: 1.1rem;
                margin-bottom: 1.5rem;
            }
            
            .welcome-principles {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .principle {
                text-align: center;
                padding: 1.5rem;
                background: rgba(255, 94, 120, 0.08);
                border-radius: var(--border-radius);
                transition: var(--transition);
            }
            
            .principle:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(255, 94, 120, 0.2);
            }
            
            .principle i {
                font-size: 2rem;
                color: var(--accent);
                margin-bottom: 0.75rem;
            }
            
            .principle h3 {
                margin-bottom: 0.75rem;
                font-size: 1.2rem;
            }
            
            .welcome-actions {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
            
            .welcome-checkbox {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
            }
            
            @media (max-width: 768px) {
                .welcome-principles {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
        
        // Close modal and set flag when user clicks "Get Started"
        document.getElementById('welcomeGetStarted').addEventListener('click', () => {
            if (document.getElementById('dontShowAgain').checked) {
                localStorage.setItem('mlnf_has_seen_welcome', 'true');
            }
            welcomeModal.style.display = 'none';
            document.body.removeChild(welcomeModal);
        });
        
        // Close modal when user clicks X button
        welcomeModal.querySelector('.close-modal').addEventListener('click', () => {
            if (document.getElementById('dontShowAgain').checked) {
                localStorage.setItem('mlnf_has_seen_welcome', 'true');
            }
            welcomeModal.style.display = 'none';
            document.body.removeChild(welcomeModal);
        });
    }
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

    // 3b. Attach Header headerRegisterButton Listener
    if (headerRegisterButton) {
        headerRegisterButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Debug Step] Header headerRegisterButton clicked.');
            if (!localStorage.getItem('sessionToken')) { 
                 openSoulModal('register');
            } else {
                console.log('[Debug Step] Header headerRegisterButton clicked while logged in, redirecting to profile.');
                window.location.href = '/profile';
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

    // Defer full auth flow for now
    console.log('[Debug Step] Deferring checkToken and full updateAuthUI for this test. Calling updateAuthUI(false) for initial hero button setup.');
    if (typeof updateAuthUI === 'function') {
         updateAuthUI(false); 
    } else {
        console.error('[Debug Step] updateAuthUI function not defined for initial UI setup.');
    }

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

    // Expose openSoulModal for console testing
    window.openSoulModal = openSoulModal;
    console.log('[Debug Step] DOMContentLoaded finished. window.openSoulModal available.');

    // Initialize messageModal component if available
    if (window.MLNF && window.MLNF.initMessageModal && !window.messageModalInitialized) {
        window.MLNF.initMessageModal();
        window.messageModalInitialized = true;
        console.log('[Debug Step] MessageModal component initialized.');
    }

    // RE-ACTIVATING PARTICLE CREATION - NOW WITH CONTINUOUS GENERATION
    // Check if we are on the admin page by looking for a unique admin element/class
    const isAdminPage = document.querySelector('main.admin-container');

    if (!isAdminPage) {
        // Initial burst of particles
        for(let i=0; i<10; i++) createParticle(); 
        // Continuously create new particles
        setInterval(createParticle, 500); // Create a new particle every 500ms
        console.log('[Debug Step] Continuous particle creation initiated after DOMContentLoaded for non-admin page.');
    } else {
        console.log('[Debug Step] Particle creation skipped for admin page.');
    }

    // MESSAGE MODAL CLOSE LISTENERS - Only attach if messageModal.js component is not available
    console.log('[MSG MODAL DEBUG] Attempting to attach close listeners.');
    console.log('[MSG MODAL DEBUG] closeMessageModalBtn:', closeMessageModalBtn);
    console.log('[MSG MODAL DEBUG] messageModal:', messageModal);
    
    // Only attach fallback listeners if the proper messageModal component is not available
    if (!window.MLNF || !window.MLNF.initMessageModal) {
        if (closeMessageModalBtn && messageModal) {
            closeMessageModalBtn.addEventListener('click', () => {
                console.log(`[MSG MODAL DEBUG] 'Close Nexus' button CLICKED.`);
                messageModal.classList.remove('active');
                messageModal.setAttribute('aria-hidden', 'true');
                console.log('[Messaging] Message modal closed via Close Nexus button.');
            });
            console.log('[Debug Step] Listener for message modal Close button ATTACHED.');
        } else {
            console.error('[MSG MODAL DEBUG] Could not attach listener to Close Nexus button.');
            console.error('[MSG MODAL DEBUG] Button:', closeMessageModalBtn);
            console.error('[MSG MODAL DEBUG] Modal:', messageModal);
        }
    } else {
        console.log('[Debug Step] Listener for message modal Close button ATTACHED.');
    }

    // The messageModal component (messageModal.js) handles its own backdrop click events
    console.log('[Debug Step] Message modal backdrop click listener is handled by messageModal.js component.');

    // SEND MESSAGE BUTTON LISTENER - Only attach if messageModal.js component is not available
    console.log('[MSG MODAL DEBUG] sendMessageBtn element check:', sendMessageBtn);
    
    // Only attach fallback listeners if the proper messageModal component is not available  
    if (!window.MLNF || !window.MLNF.initMessageModal) {
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
    } else {
        console.log('[Debug Step] Listener for sendMessageBtn ATTACHED.');
    }

    // Soul Modal Form Submission Logic - NOW ACTIVATED
    if (soulLoginForm && soulModal) { 
        soulLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('[Login Debug] Form submitted.');
            if (!modalFeedback) {
                console.error('modalFeedback element not found for displaying messages.');
                return;
            }
            modalFeedback.textContent = '';

            const username = soulLoginForm.username.value.trim();
            const password = soulLoginForm.password.value;
            const mode = soulModal.dataset.mode || 'login';
            console.log(`[Login Debug] Mode: ${mode}, Username: ${username}`);

            if (!username || !password) {
                modalFeedback.textContent = 'Soul Identifier and Ethereal Key are required.';
                console.log('[Login Debug] Username or password missing.');
                return;
            }

            let url = '';
            let payload = { username, password };

            if (mode === 'register') {
                const confirmPassword = soulLoginForm.confirmPassword.value;
                if (password !== confirmPassword) {
                    modalFeedback.textContent = 'Ethereal Keys do not align.';
                    console.log('[Login Debug] Passwords do not match in register mode.');
                    return;
                }
                url = `${API_URL}/auth/signup`;
            } else {
                url = `${API_URL}/auth/login`;
            }
            console.log(`[Login Debug] API URL: ${url}`);

            soulModalSubmit.disabled = true;
            soulModalSubmit.textContent = mode === 'register' ? 'Forging...' : 'Transcending...';
            console.log('[Login Debug] Submit button disabled.');

            try {
                console.log('[Login Debug] Attempting fetch...');
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                console.log('[Login Debug] Fetch response received:', response.status);

                const data = await response.json();
                console.log('[Login Debug] Response data:', data);

                if (!response.ok) {
                    modalFeedback.textContent = data.message || `Error: ${response.status} - ${response.statusText}`;
                    console.log('[Login Debug] Response not OK:', data.message || `Error: ${response.status} - ${response.statusText}`);
                    throw new Error(data.message || `HTTP error ${response.status}`);
                }

                if (mode === 'login') {
                    if (data.token) {
                        localStorage.setItem('sessionToken', data.token);
                        modalFeedback.textContent = 'Sanctuary access granted. The gateway opens...';
                        console.log('[Login Debug] Login successful, token stored.');
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
                        console.log('[Login Debug] Token not received in login mode.');
                    }
                } else { // Register
                    // Registration successful - handle like login since backend returns token and user
                    if (data.token) {
                        localStorage.setItem('sessionToken', data.token);
                        
                        // Store user data if provided
                        if (data.user) {
                            localStorage.setItem('user', JSON.stringify(data.user));
                        }
                        
                        modalFeedback.textContent = 'Eternity claimed! Welcome to the Sanctuary.';
                        console.log('[Login Debug] Registration successful, token stored.');
                        await updateAuthUI(true);
                        setTimeout(() => {
                            closeSoulModal();
                            // Optionally, refresh online users if sidebar was open or redirect
                            if (activeUsers && activeUsers.classList.contains('active')) {
                                fetchOnlineUsers();
                            }
                        }, 1500);
                    } else {
                        // Fallback if no token (shouldn't happen with current backend)
                        modalFeedback.textContent = data.message || 'Eternity claimed! Please enter the Sanctuary now.';
                        console.log('[Login Debug] Registration successful.');
                        // Optionally switch to login view or auto-login
                        setTimeout(() => {
                            setSoulModalView('login'); // Switch to login view
                        }, 2000);
                    }
                }

            } catch (error) {
                console.error(`[Auth Form Error - ${mode}]:`, error);
                if (!modalFeedback.textContent) { // Avoid overwriting specific backend error
                    modalFeedback.textContent = 'An unexpected disturbance occurred. Try again.';
                }
                console.log('[Login Debug] Error caught:', error.message);
            } finally {
                soulModalSubmit.disabled = false;
                soulModalSubmit.textContent = mode === 'register' ? 'Begin Your Eternity' : 'Transcend';
                console.log('[Login Debug] Submit button re-enabled in finally block.');
            }
        }); 
        console.log('[Reintegration] Soul Modal form submission listener ATTACHED.');
    } else {
        console.error('[Reintegration] Could not attach soul modal form listener. soulLoginForm or soulModal not found.');
    }

    // Attach logout event listener
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
        console.log('[Debug Step] Listener for logoutLink (Transcend Session) ATTACHED.');
    } else {
        console.error('[Debug Step] logoutLink (id: logoutLink) not found!');
    }

    // Check if user is logged in and show welcome modal if needed
    if (isLoggedIn()) {
        showWelcomeModal();
    }
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

// Initial auth state check and UI update - RE-ENABLING NOW
(async () => {
    try {
        console.log('[Reintegration] Performing initial authentication check...');
        const isAuthenticated = await checkToken();
        console.log('[Reintegration] Initial isAuthenticated status:', isAuthenticated);
        await updateAuthUI(isAuthenticated);
        // Set initial modal view only if modal exists and user is NOT authenticated,
        // to avoid showing it if they are already logged in.
        if (soulModal && !isAuthenticated) {
            setSoulModalView('login'); 
        }
        console.log('[Reintegration] Initial UI update complete.');
    } catch (error) {
        console.error("[Reintegration] Error during initial checkToken/updateAuthUI:", error);
        // Fallback to logged-out UI in case of error during initial check
        await updateAuthUI(false); 
        if (soulModal) {
            setSoulModalView('login');
        }
    }
})();

// Particles - REMAINS COMMENTED OUT FOR NOW
// for(let i=0; i<15; i++) createParticle(); 

// console.log('[Reintegration Stage X] End of DOMContentLoaded setup.'); // This log line is now part of the active DOMContentLoaded