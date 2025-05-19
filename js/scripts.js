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
async function fetchOnlineUsers(retryCount = 3, delay = 1000) {
    const userList = document.getElementById('userList');
    if (!userList) {
        console.error('[Reintegration] userList element not found for fetchOnlineUsers.');
        return;
    }
    userList.innerHTML = '<p class="modal-loading">Summoning eternal seekers... <span class="spinner"></span></p>';
    const token = localStorage.getItem('sessionToken');

    if (!token) {
        userList.innerHTML = '<p class="modal-error">Sanctuary access required. Please enter.</p>';
        return;
    }
    // ... (rest of fetchOnlineUsers logic, simplified for brevity if it was long, ensure it uses userList.innerHTML)
    // For now, placeholder if no actual API call is made in the original commented code:
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                userList.innerHTML = '<p class="modal-error">Session ended. Please re-enter.</p>';
                localStorage.removeItem('sessionToken');
                // updateAuthUI(false); // updateAuthUI will be restored later
            } else {
                userList.innerHTML = `<p class="modal-error">Error summoning seekers: ${response.statusText}</p>`;
            }
            return;
        }
        const users = await response.json();
        if (users.length === 0) {
            userList.innerHTML = '<p class="modal-error">No eternal seekers currently manifest.</p>';
            return;
        }
        userList.innerHTML = users.map(user => `
            <div class="profile-preview" data-username="${user.username}" role="listitem">
                <img src="${user.avatar || 'https://i.pravatar.cc/40?u='+user.username}" alt="${user.username}'s avatar">
                <div class="user-info">
                    <a href="pages/profiles.html?username=${user.username}" class="username-link">${user.displayName || user.username}</a>
                    <span class="online-dot"></span>
                    <p class="status">${user.status || 'Awaiting revelation...'}</p>
                </div>
            </div>`).join('');
        
        document.querySelectorAll('.profile-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                const username = preview.dataset.username;
                if (typeof openMessageModal === 'function') openMessageModal(username); // Check if defined
            });
        });
    } catch (error) {
        console.error('[Reintegration] Fetch online users API error:', error);
        userList.innerHTML = `<p class="modal-error">Could not summon seekers: Network issue or API down.</p>`;
    }
}

// Messaging modal functions (Restored)
function openMessageModal(username) {
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
    console.log('[Reintegration Stage X] checkToken initiated.');
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
    console.warn('[Reintegration Stage X] checkToken: Token validation failed or user not fetched. Clearing session.');
            localStorage.removeItem('sessionToken');
            return false;
        }

// Logout function (Restored)
function logout() {
        localStorage.removeItem('sessionToken');
    console.log('[Reintegration Stage X] User logged out');
    updateAuthUI(false); // Assumes updateAuthUI is defined
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
        const user = await fetchCurrentUser(); 
        if (user && usernameDisplay) {
            usernameDisplay.textContent = user.username || 'Immortal';
        } else if (usernameDisplay) {
            usernameDisplay.textContent = 'Immortal'; 
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
        headerSoulButton.addEventListener('click', () => {
            console.log('[Debug Step] Header soulButton clicked.');
            if (!localStorage.getItem('sessionToken')) { 
                 openSoulModal('login');
            } else {
                console.log('[Debug Step] Header soulButton clicked while (simulated) logged in.');
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

    // Defer full auth flow for now
    console.log('[Debug Step] Deferring checkToken and full updateAuthUI for this test. Calling updateAuthUI(false) for initial hero button setup.');
    if (typeof updateAuthUI === 'function') {
         updateAuthUI(false); 
    } else {
        console.error('[Debug Step] updateAuthUI function not defined for initial UI setup.');
    }

    // ADDED SIDEBAR EVENT LISTENERS (MOVED HERE FOR CORRECT SCOPE)
    if (showUsersBtn && activeUsers) {
        showUsersBtn.addEventListener('click', () => {
            console.log('[Reintegration Stage Y] Show Users button clicked.');
            if (localStorage.getItem('sessionToken')) {
                activeUsers.classList.add('active');
                fetchOnlineUsers(); // Fetch users when sidebar opens
            } else {
                openSoulModal('login'); // Prompt login if not authenticated
                if(document.getElementById('userList')) document.getElementById('userList').innerHTML = '<p class="modal-error">Please log in to view active users.</p>';
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
});

// Soul Modal Form Submission Logic - REMAINS COMMENTED OUT FOR NOW
/*
if (soulLoginForm && soulModal) { 
    soulLoginForm.addEventListener('submit', async function(e) { ... }); 
}
*/

// Sidebar, Message Modal, User Menu, Logout Link listeners.
// showUsersBtn and closeUsers listeners were moved into DOMContentLoaded and activated.
// The rest remain here, commented:
/*
if (sendMessageBtn && messageInput) { ... }
if (closeMessageModalBtn && messageModal) { ... }
if (userMenuButton && userDropdown) { ... }
if (logoutLink) { ... }
*/

// Initial auth state check and UI update - REMAINS COMMENTED OUT FOR NOW
/*
checkToken().then(isAuthenticated => {
    updateAuthUI(isAuthenticated);
    if (soulModal) setSoulModalView('login'); 
}).catch(error => {
    console.error("[Reintegration Stage X] Error during initial checkToken/updateAuthUI:", error);
    updateAuthUI(false); 
});
*/

// Particles - REMAINS COMMENTED OUT FOR NOW
// for(let i=0; i<15; i++) createParticle(); 

// console.log('[Reintegration Stage X] End of DOMContentLoaded setup.'); // This log line is now part of the active DOMContentLoaded