// DEPLOYMENT TEST V5 - DATE: [Current Date/Time]
// Function definitions: setSoulModalView, openSoulModal, closeSoulModal, createParticle, fetchCurrentUser, fetchOnlineUsers, openMessageModal, loadMessages, checkToken, logout, updateAuthUI - ALL DEFINED BEFORE DOMContentLoaded

// Global-like variables for DOM elements accessed by global functions - assigned in DOMContentLoaded
let soulModal, soulModalTitle, soulLoginForm, soulModalSubmit, modalFeedback, confirmPasswordField, modalToggleView;
let activeUsers; // Used by logout()

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
    // Attempt to refresh UI if possible
    if (typeof updateAuthUIAndFetchUsers === 'function') {
        updateAuthUIAndFetchUsers();
    }
}

function disableMockLogin() {
    window.MOCK_LOGGED_IN_STATE = false;
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
    if (!soulModal || !soulLoginForm || !soulModalTitle || !confirmPasswordField || !soulModalSubmit || !modalToggleView) {
        console.error('setSoulModalView: Crucial modal elements missing');
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
}

function openSoulModal(mode = 'login') {
    if (!soulModal) {
        console.error('openSoulModal: soulModal element not found!');
        return;
    }
    setSoulModalView(mode); 
    soulModal.style.display = 'flex';
    const usernameInput = soulModal.querySelector('input[name="username"]');
    if (usernameInput) usernameInput.focus();
}

function closeSoulModal() {
    if (!soulModal) {
        console.error('closeSoulModal: soulModal is not defined or found!');
        return;
    }
    soulModal.style.display = 'none';
    if (modalFeedback) modalFeedback.textContent = '';
    if (soulLoginForm) soulLoginForm.reset();
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
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.appendChild(particle);
    } else {
    document.body.appendChild(particle);
    }
    setTimeout(() => particle.remove(), 10000);
}

// Fetch current user data (Restored)
async function fetchCurrentUser() {
    if (window.MOCK_LOGGED_IN_STATE === true) {
        return { username: 'MockUser', displayName: 'Mock Immortal', email: 'mock@mlnf.net', avatar: 'https://i.pravatar.cc/40?u=mockuser' };
    }
    const token = localStorage.getItem('sessionToken');
    if (!token) {
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
                localStorage.removeItem('sessionToken');
            }
            // throw new Error(`HTTP error ${response.status}: ${response.statusText}`); // Let caller handle UI for this
            return null; 
        }
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Fetch current user error:', error.message);
        return null;
    }
}

// Fetch online users with retry (Restored)
async function fetchOnlineUsers() {
    const apiBaseUrl = localStorage.getItem('apiBaseUrl') || 'https://mlnf.reintegrate.ai';
    const token = localStorage.getItem('token');

    if (!token) {
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
            console.error('Fetch online users API error:', response.status, errorText);
            updateSeekersList({ error: `Could not summon seekers: ${response.status} ${errorText || 'Unknown error'}` });
            return;
        }

        const responseData = await response.json();

        const usersArray = responseData.users;

        if (!usersArray || !Array.isArray(usersArray)) {
            console.error('Fetched data.users is not an array or is missing:', usersArray);
            updateSeekersList({ error: "Could not summon seekers: Invalid data format from server." });
            return;
        }
        
        updateSeekersList(usersArray);

    } catch (error) {
        console.error('Fetch online users API error:', error);
        updateSeekersList({ error: "Could not summon seekers: Network issue or API down." });
    }
}

function updateSeekersList(users) {
    const seekersList = document.getElementById('seekersList');
    const seekersLoading = document.getElementById('seekersLoading');
    const seekersError = document.getElementById('seekersError');

    if (!seekersList || !seekersLoading || !seekersError) {
        console.error('Seekers list UI elements not found.');
        return;
    }

    seekersLoading.style.display = 'none';
    seekersError.textContent = ''; // Clear previous errors

    if (users.error) {
        seekersError.textContent = users.error;
        seekersList.innerHTML = ''; // Clear list on error
        return;
    }

    if (!Array.isArray(users)) {
        console.error('updateSeekersList received non-array users (and not an error object):', users);
        seekersError.textContent = 'Unexpected data received for user list.';
        seekersList.innerHTML = '';
        return;
    }
    

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
    const isAuthenticated = await checkToken(); 

    if (!isAuthenticated) {
        openSoulModal('login'); // Redirect to login/register if not authenticated
        return;
    }


    // Check if messageModal.js component is available and properly initialized
    if (window.MLNF && window.MLNF.openMessageModal && window.messageModalInitialized) {
        // Use the proper messageModal.js component
        return window.MLNF.openMessageModal(username);
    }

    // If component exists but isn't initialized yet, try to initialize it
    if (window.MLNF && window.MLNF.initMessageModal && !window.messageModalInitialized) {
        
        // Check if elements exist
        const requiredElements = ['messageModal', 'recipientName', 'messageInput', 'messageHistory', 'sendMessageBtn', 'closeMessageModal'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Cannot initialize messageModal, missing elements:', missingElements);
        } else {
            window.MLNF.initMessageModal();
            window.messageModalInitialized = true;
            return window.MLNF.openMessageModal(username);
        }
    }

    // Fallback to old modal system for compatibility
    if (!messageModal || !recipientName || !messageHistory || !messageInput) {
        console.error('Message modal elements not found for openMessageModal.');
        alert('Message modal elements are not ready. Please try again later.');
        return;
    }
    recipientName.textContent = username;
    messageHistory.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
    
    // Use the proper .active class system instead of direct style manipulation
    messageModal.classList.add('active');
    messageModal.setAttribute('aria-hidden', 'false');
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
    if (window.MOCK_LOGGED_IN_STATE === true) {
        return true;
    }
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        return false;
    }
    const user = await fetchCurrentUser(); 
    if (user) {
        return true;
    }
    // Correctly scoped fallback for invalid token / user fetch failure
    localStorage.removeItem('sessionToken');
    return false;
}

// Logout function (Restored)
async function logout() {
    const token = localStorage.getItem('sessionToken');

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
            } else {
                const errorResult = await response.text();
                console.warn(`Backend logout failed. Status: ${response.status}, Message: ${errorResult}`);
            }
        } catch (error) {
            console.error('Error during backend logout API call:', error);
        }
    }

    localStorage.removeItem('sessionToken');
    
    updateAuthUI(false); 
    if (activeUsers && activeUsers.classList.contains('active')) {
        activeUsers.classList.remove('active');
        const userList = document.getElementById('userList');
        if(userList) userList.innerHTML = '<p class="modal-error">Sanctuary access required. Please enter.</p>';
    }
}

// Update auth UI elements (Restored & Modified to use openSoulModal)
async function updateAuthUI(isAuthenticated) {
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
                userMenuAvatar.src = avatarUrlToSet; 
                userMenuAvatar.alt = user.username ? `${user.username}'s avatar` : 'User Avatar';
                userMenuAvatar.style.display = 'inline'; 
            }
        } else { // User fetch failed or no user data, but still authenticated (e.g. token valid but /me fails)
            if (usernameDisplay) usernameDisplay.textContent = 'Immortal'; 
            if (userMenuAvatar) {
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
}

// Helper function to check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('sessionToken');
}

// Welcome modal removed - was interfering with other modals

document.addEventListener('DOMContentLoaded', () => {

    // 1. Assign ALL DOM elements FIRST
    // Variables for global functions (assigned here)
    soulModal = document.getElementById('soulModal');
    soulModalTitle = document.getElementById('soulModalTitle');
    soulLoginForm = document.getElementById('soulLoginForm');
    soulModalSubmit = document.getElementById('soulModalSubmit');
    modalFeedback = document.getElementById('modalFeedback');
    confirmPasswordField = document.getElementById('confirmPasswordField');
    modalToggleView = document.getElementById('modalToggleView');
    
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
    const userMenu = document.getElementById('userMenu');
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    const logoutLink = document.getElementById('logoutLink');

    // 2. Attach Core Modal Event Listeners
    if (soulModal) {
        const modalCloseXButton = soulModal.querySelector('.close-modal');
        if (modalCloseXButton) {
            modalCloseXButton.addEventListener('click', closeSoulModal);
        }
        soulModal.addEventListener('click', (event) => {
            if (event.target === soulModal) closeSoulModal();
        });
    } else {
        console.error('soulModal not found! Cannot attach close listeners.');
    }

    if (modalToggleView) {
        modalToggleView.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                if (event.target.id === 'switchToRegisterLink') {
                    setSoulModalView('register');
                } else if (event.target.id === 'switchToLoginLink') {
                    setSoulModalView('login');
                }
            }
        });
    } else {
        console.error('modalToggleView not found! Cannot attach view toggle listener.');
    }

    // 3. Attach Header soulButton Listener
    if (headerSoulButton) {
        headerSoulButton.addEventListener('click', async () => {
            const isAuthenticated = await checkToken();
            if (!isAuthenticated) { 
                 openSoulModal('login');
            } else {
                if(userDropdown) userDropdown.classList.toggle('active'); 
            }
        });
    } else {
        console.error('Header soulButton (id: soulButton) not found!');
    }

    // 3b. Attach Header headerRegisterButton Listener
    if (headerRegisterButton) {
        headerRegisterButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (!localStorage.getItem('sessionToken')) { 
                 openSoulModal('register');
            } else {
                window.location.href = '/profile';
            }
        });
    } else {
        console.error('Header headerRegisterButton (id: headerRegisterButton) not found!');
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
    if (typeof updateAuthUI === 'function') {
         updateAuthUI(false); 
    } else {
        console.error('updateAuthUI function not defined for initial UI setup.');
    }

    // ADDED SIDEBAR EVENT LISTENERS (MOVED HERE FOR CORRECT SCOPE)
    if (showUsersBtn && activeUsers) {
        showUsersBtn.addEventListener('click', async () => {
            const isAuthenticated = await checkToken();
            if (isAuthenticated) {
                activeUsers.classList.add('active');
                fetchOnlineUsers();
            } else {
                openSoulModal('login');
                const userList = document.getElementById('userList');
                if(userList) userList.innerHTML = '<p class="modal-error">Please log in to view active users.</p>';
            }
        });
    }

    // Expose openSoulModal for console testing
    window.openSoulModal = openSoulModal;

    // Initialize messageModal component if available
    if (window.MLNF && window.MLNF.initMessageModal && !window.messageModalInitialized) {
        
        // Add a small delay to ensure DOM elements are ready
        setTimeout(() => {
            // Check if elements exist before initializing
            const requiredElements = ['messageModal', 'recipientName', 'messageInput', 'messageHistory', 'sendMessageBtn', 'closeMessageModal'];
            const missingElements = requiredElements.filter(id => !document.getElementById(id));
            
            if (missingElements.length > 0) {
                console.error('Missing elements for messageModal:', missingElements);
                return;
            }
            
            window.MLNF.initMessageModal();
            window.messageModalInitialized = true;
        }, 100);
    } else if (!window.MLNF || !window.MLNF.initMessageModal) {
    } else if (window.messageModalInitialized) {
    }

    // RE-ACTIVATING PARTICLE CREATION - NOW WITH CONTINUOUS GENERATION
    const isAdminPage = document.querySelector('main.admin-container');
    const hasHeroSection = document.querySelector('.hero');

    if (!isAdminPage && hasHeroSection) {
        // Initial burst of particles
        for(let i=0; i<10; i++) createParticle(); 
        // Continuously create new particles
        setInterval(createParticle, 500); // Create a new particle every 500ms
    } else if (isAdminPage) {
    } else {
    }

    // MESSAGE MODAL CLOSE LISTENERS - Only attach if messageModal.js component is not available
    
    // Only attach fallback listeners if the proper messageModal component is not available
    if (!window.MLNF || !window.MLNF.initMessageModal) {
        if (closeMessageModalBtn && messageModal) {
            closeMessageModalBtn.addEventListener('click', () => {
                messageModal.classList.remove('active');
                messageModal.setAttribute('aria-hidden', 'true');
            });
        } else {
            console.error('Could not attach listener to Close Nexus button.');
        }
    } else {
    }

    // The messageModal component (messageModal.js) handles its own backdrop click events

    // SEND MESSAGE BUTTON LISTENER - Only attach if messageModal.js component is not available
    
    // Only attach fallback listeners if the proper messageModal component is not available  
    if (!window.MLNF || !window.MLNF.initMessageModal) {
        if (sendMessageBtn && messageInput) {
            sendMessageBtn.addEventListener('click', () => {
                if(messageInput) messageInput.value = ''; 
            });
        } else {
            console.error('Could not attach listener to Send Whisper button.');
        }
    } else {
    }

    // Soul Modal Form Submission Logic - NOW ACTIVATED
    if (soulLoginForm && soulModal) { 
        soulLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!modalFeedback) {
                console.error('modalFeedback element not found for displaying messages.');
                return;
            }
            modalFeedback.textContent = '';

            const username = soulLoginForm.username.value.trim();
            const password = soulLoginForm.password.value;
            const mode = soulModal.dataset.mode || 'login';

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
                url = `${API_URL}/auth/signup`;
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
                        await updateAuthUIAndFetchUsers(); // Update UI after successful login
                        
                        // Show success feedback and auto-close after delay
                        modalFeedback.innerHTML = '<span style="color: var(--success);">Login successful! Welcome back, Soul.</span>';
                        setTimeout(() => {
                            closeSoulModal();
                        }, 1500);
                        
                        // Clear feedback after closing
                        setTimeout(() => {
                            modalFeedback.innerHTML = '';
                        }, 2000);
                    } else {
                        modalFeedback.textContent = 'Token not received. Entry denied.';
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
                        await updateAuthUIAndFetchUsers(); // Update UI after successful registration
                        
                        // Show success feedback and auto-close after delay
                        modalFeedback.innerHTML = '<span style="color: var(--success);">Registration successful! Welcome to the Liberation, Soul.</span>';
                        setTimeout(() => {
                            closeSoulModal();
                        }, 1500);
                        
                        // Clear feedback after closing
                        setTimeout(() => {
                            modalFeedback.innerHTML = '';
                        }, 2000);
                    } else {
                        // Fallback if no token (shouldn't happen with current backend)
                        modalFeedback.textContent = data.message || 'Eternity claimed! Please enter the Sanctuary now.';
                        // Optionally switch to login view or auto-login
                        setTimeout(() => {
                            setSoulModalView('login'); // Switch to login view
                        }, 2000);
                    }
                }

            } catch (error) {
                console.error('Authentication error:', error);
                modalFeedback.innerHTML = `<span style="color: var(--danger);">${error.message}</span>`;
            } finally {
                soulModalSubmit.disabled = false;
                soulModalSubmit.textContent = mode === 'register' ? 'Begin Your Eternity' : 'Transcend';
            }
        }); 
    } else {
        console.error('Could not attach soul modal form listener. soulLoginForm or soulModal not found.');
    }

    // Attach logout event listener
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    } else {
        console.error('logoutLink (id: logoutLink) not found!');
    }

    // Check if user is logged in and show welcome modal if needed
    if (isLoggedIn()) {
        // Remove the showWelcomeModal call
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
        const isAuthenticated = await checkToken();
        await updateAuthUI(isAuthenticated);
        // Set initial modal view only if modal exists and user is NOT authenticated,
        // to avoid showing it if they are already logged in.
        if (soulModal && !isAuthenticated) {
            setSoulModalView('login'); 
        }
    } catch (error) {
        console.error("Error during initial checkToken/updateAuthUI:", error);
        // Fallback to logged-out UI in case of error during initial check
        await updateAuthUI(false); 
        if (soulModal) {
            setSoulModalView('login');
        }
    }
})();

 

