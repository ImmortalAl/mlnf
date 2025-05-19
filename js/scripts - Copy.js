document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Starting minimal modal test script.');

    const soulModal = document.getElementById('soulModal');
    console.log('Attempting to find soulModal. Result:', soulModal);

    if (soulModal) {
        const closeModalButton = soulModal.querySelector('.close-modal');
        console.log('Attempting to find .close-modal button. Result:', closeModalButton);

        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                console.log('[Minimal Test] X button clicked!');
                soulModal.style.display = 'none';
            });
            console.log('[Minimal Test] Event listener for X button ATTACHED.');
        } else {
            console.error('[Minimal Test] .close-modal button not found inside soulModal.');
        }

        soulModal.addEventListener('click', function(event) {
            if (event.target === soulModal) {
                console.log('[Minimal Test] Outside modal area clicked!');
                soulModal.style.display = 'none';
            }
        });
        console.log('[Minimal Test] Event listener for outside click ATTACHED to soulModal.');

        const modalToggleView = document.getElementById('modalToggleView');
        console.log('[Minimal Test] Attempting to find modalToggleView. Result:', modalToggleView);
        if (modalToggleView) {
            modalToggleView.addEventListener('click', function(event) {
                console.log('[Minimal Test] Click detected inside modalToggleView. Target ID:', event.target.id);
                event.preventDefault(); 

                // Simplified view switching logic for this test
                const titleEl = document.getElementById('soulModalTitle');
                const confirmPassEl = document.getElementById('confirmPasswordField');
                const submitBtnEl = document.getElementById('soulModalSubmit');
                const toggleViewEl = document.getElementById('modalToggleView');

                if (!titleEl || !confirmPassEl || !submitBtnEl || !toggleViewEl) {
                    console.error('[Minimal Test] One or more modal sub-elements for view toggle not found!');
                    return;
                }

                if (event.target.id === 'switchToRegisterLink') {
                    console.log('[Minimal Test] switchToRegisterLink clicked');
                    titleEl.textContent = 'Claim Your Immortality (Test)';
                    confirmPassEl.style.display = 'block';
                    submitBtnEl.textContent = 'Begin (Test)';
                    toggleViewEl.innerHTML = 'Already an Immortal? <a href="#" id="switchToLoginLink">Enter Now (Test)</a>';
                } else if (event.target.id === 'switchToLoginLink') {
                    console.log('[Minimal Test] switchToLoginLink clicked');
                    titleEl.textContent = 'Enter Sanctuary (Test)';
                    confirmPassEl.style.display = 'none';
                    submitBtnEl.textContent = 'Transcend (Test)';
                    toggleViewEl.innerHTML = 'New to Sanctuary? <a href="#" id="switchToRegisterLink">Claim Immortality (Test)</a>';
                }
            });
            console.log('[Minimal Test] Event listener for view toggle ATTACHED to modalToggleView.');
        } else {
            console.error('[Minimal Test] modalToggleView element not found.');
        }

    } else {
        console.error('[Minimal Test] soulModal element not found. Crucial modal functionality will fail.');
    }
    
    // Expose a function to manually open the modal for testing
    window.testOpenModal = (mode = 'login') => {
        console.log(`[Minimal Test] testOpenModal called with mode: ${mode}`);
        if (soulModal) {
            const titleEl = document.getElementById('soulModalTitle');
            const confirmPassEl = document.getElementById('confirmPasswordField');
            const submitBtnEl = document.getElementById('soulModalSubmit');
            const toggleViewEl = document.getElementById('modalToggleView');

            if (!titleEl || !confirmPassEl || !submitBtnEl || !toggleViewEl) {
                console.error('[Minimal Test] Cannot open/setup modal, one or more sub-elements not found!');
                return;
            }

            if (mode === 'register') {
                titleEl.textContent = 'Claim Your Immortality (Test)';
                confirmPassEl.style.display = 'block';
                // confirmPassEl.querySelector('input').required = true; // Not setting required for this minimal test
                submitBtnEl.textContent = 'Begin (Test)';
                toggleViewEl.innerHTML = 'Already an Immortal? <a href="#" id="switchToLoginLink">Enter Now (Test)</a>';
            } else { // Default to login
                titleEl.textContent = 'Enter Sanctuary (Test)';
                confirmPassEl.style.display = 'none';
                // confirmPassEl.querySelector('input').required = false;
                submitBtnEl.textContent = 'Transcend (Test)';
                toggleViewEl.innerHTML = 'New to Sanctuary? <a href="#" id="switchToRegisterLink">Claim Immortality (Test)</a>';
            }
            soulModal.style.display = 'flex';
            console.log('[Minimal Test] soulModal display set to flex.');
        } else {
            console.error('[Minimal Test] Cannot open modal, soulModal element not found.');
        }
    };
    console.log('[Minimal Test] testOpenModal function is now available on the window object. Call it from console to show the modal.');

    // Automatically open the modal for immediate testing
    // Comment this out if you prefer to call window.testOpenModal() manually
    // setTimeout(() => { window.testOpenModal('login'); }, 100);

});

/* 
// ORIGINAL SCRIPT CONTENT STARTS HERE
// =======================================
// Backend API URL
const API_URL = 'https://mlnf-auth.onrender.com/api';

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Check if dark theme is enabled in localStorage
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
} else {
    document.body.classList.remove('dark-theme');
    if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');
if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
}

// Particles animation
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

// Sidebar toggle
const showUsersBtn = document.getElementById('showUsersBtn');
const activeUsers = document.getElementById('activeUsers');
const closeUsers = document.getElementById('closeUsers');

if (showUsersBtn && activeUsers) {
    showUsersBtn.addEventListener('click', () => {
        activeUsers.classList.toggle('active');
        if (activeUsers.classList.contains('active')) {
            fetchOnlineUsers();
        }
    });
}

if (closeUsers && activeUsers) {
    closeUsers.addEventListener('click', () => {
        activeUsers.classList.remove('active');
    });
}

// Fetch online users with retry
async function fetchOnlineUsers(retryCount = 3, delay = 1000) {
    const userList = document.getElementById('userList');
    if (!userList) return;
    userList.innerHTML = '<p class="modal-loading">Summoning eternal seekers... <span class="spinner"></span></p>';

    const token = localStorage.getItem('sessionToken');
    console.log('Fetching online users with token:', token ? token.substring(0, 10) + '...' : 'No token');

    if (!token) {
        userList.innerHTML = '<p class="modal-error">Sanctuary access required. Please enter.</p>';
        return;
    }

    let users = [];
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            console.log(`Attempt ${attempt} to fetch online users from ${API_URL}/users`);
            const response = await fetch(`${API_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Fetch users response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    userList.innerHTML = '<p class="modal-error">Session ended. Please re-enter.</p>';
                    localStorage.removeItem('sessionToken');
                    updateAuthUI(false);
                    return;
                }
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }

            users = await response.json();
            console.log('Fetched users:', users);
            break; // Success, exit retry loop
        } catch (error) {
            console.error(`Fetch users attempt ${attempt} failed:`, error.message, error.stack);
            if (attempt === retryCount) {
                userList.innerHTML = `<p class="modal-error">Failed to summon seekers: ${error.message}. Falling back to current user...</p>`;
                // Fallback to current user
                const currentUser = await fetchCurrentUser();
                if (currentUser && currentUser.online) {
                    users = [currentUser];
                } else {
                    userList.innerHTML = '<p class="modal-error">No eternal seekers online. Please try again later.</p>';
                    return;
                }
            } else {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    if (users.length === 0) {
        userList.innerHTML = '<p class="modal-error">No eternal seekers online</p>';
        return;
    }

    userList.innerHTML = users.map(user => `
        <div class="profile-preview" data-username="${user.username}" role="listitem" aria-label="User ${user.username}">
            <img src="${user.avatar || 'https://i.pravatar.cc/40'}" alt="${user.username}'s avatar">
            <div class="user-info">
                <a href="pages/profiles.html?username=${user.username}" class="username-link">${user.displayName || user.username}</a>
                <span class="online-dot" aria-hidden="true"></span>
                <p class="status">${user.status || 'No status set'}</p>
            </div>
        </div>
    `).join('');

    // Add click handlers for messaging
    document.querySelectorAll('.profile-preview').forEach(preview => {
        preview.addEventListener('click', () => {
            const username = preview.dataset.username;
            openMessageModal(username);
        });
    });
}

// Fetch current user data
async function fetchCurrentUser() {
    const token = localStorage.getItem('sessionToken');
    console.log('Fetching current user with token:', token ? token.substring(0, 10) + '...' : 'No token');
    if (!token) {
        console.warn('No session token found for current user');
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Fetch current user response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn('Invalid or expired token. Clearing session.');
                localStorage.removeItem('sessionToken');
            }
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const user = await response.json();
        console.log('Current user fetched:', user.username);
        return user;
    } catch (error) {
        console.error('Fetch current user error:', error.message, error.stack);
        return null;
    }
}

// Messaging modal
const messageModal = document.getElementById('messageModal');
const recipientName = document.getElementById('recipientName');
const messageHistory = document.getElementById('messageHistory');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const closeMessageModalBtn = document.getElementById('closeMessageModal'); // Renamed for clarity

function openMessageModal(username) {
    if (!messageModal || !recipientName || !messageHistory) return;
    recipientName.textContent = username;
    messageHistory.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
    messageModal.style.display = 'block';
    loadMessages(username);
}

async function loadMessages(recipient) {
    // Placeholder for message fetching logic
    if (!messageHistory) return;
    messageHistory.innerHTML = `
        <div class="message-bubble received">
            Greetings, eternal seeker! <small>${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="message-bubble sent">
            Hail, fellow spirit! <small>${new Date().toLocaleTimeString()}</small>
        </div>
    `;
}

if (sendMessageBtn && messageInput && messageHistory && recipientName) {
    sendMessageBtn.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) return;

        messageHistory.innerHTML += `
            <div class="message-bubble sent">
                ${message} <small>${new Date().toLocaleTimeString()}</small>
            </div>
        `;
        messageInput.value = '';
        messageHistory.scrollTop = messageHistory.scrollHeight;

        // Placeholder for sending message to backend
        try {
            const token = localStorage.getItem('sessionToken');
            // await fetch(`${API_URL}/messages`, {
            //     method: 'POST',
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({ recipient: recipientName.textContent, message })
            // });
        } catch (error) {
            console.error('Send message error:', error);
            messageHistory.innerHTML += '<p class="modal-error">Failed to send whisper</p>';
        }
    });
}

if (closeMessageModalBtn && messageModal && messageInput && messageHistory) {
    closeMessageModalBtn.addEventListener('click', () => {
        messageModal.style.display = 'none';
        messageInput.value = '';
        messageHistory.innerHTML = '';
    });
}

// Token validation
async function checkToken() {
    const token = localStorage.getItem('sessionToken');
    console.log('Checking token:', token ? token.substring(0, 10) + '...' : 'No token');
    if (!token) {
        console.warn('No session token found');
        return false;
    }

    const user = await fetchCurrentUser();
    if (user) {
        console.log('Token is valid, user is authenticated');
        return true; // Token is valid, user data fetched
    }
    // If fetchCurrentUser returned null, it means token was invalid or fetching failed
    console.warn('Token validation failed or user not fetched. Clearing session.');
    localStorage.removeItem('sessionToken'); // Ensure invalid token is cleared
    return false;
}

// Logout function
function logout() {
    localStorage.removeItem('sessionToken');
    console.log('User logged out');
    updateAuthUI(false);
    // Optional: Redirect to home or refresh if desired
    // window.location.href = 'index.html'; 
    // For now, just update UI, user might want to stay on page
    if (activeUsers && activeUsers.classList.contains('active')) {
        activeUsers.classList.remove('active');
        const userList = document.getElementById('userList');
        if(userList) userList.innerHTML = '<p class="modal-error">Sanctuary access required. Please enter.</p>';
    }
}

// --- Soul Modal: Element Definitions (moved for earlier access if needed by functions below) ---
const soulModal = document.getElementById('soulModal');
const soulModalTitle = document.getElementById('soulModalTitle');
const soulLoginForm = document.getElementById('soulLoginForm');
const soulModalSubmit = document.getElementById('soulModalSubmit');
const modalFeedback = document.getElementById('modalFeedback');
const confirmPasswordField = document.getElementById('confirmPasswordField');
const modalToggleView = document.getElementById('modalToggleView');

const switchToRegisterLinkHTML = 'New to the Sanctuary? <a href="#" id="switchToRegisterLink">Claim Your Immortality</a>';
const switchToLoginLinkHTML = 'Already an Immortal? <a href="#" id="switchToLoginLink">Enter Now</a>';


// --- Soul Modal: Core Logic Functions ---
function setSoulModalView(mode) {
    console.log('[Full Script] setSoulModalView called with mode:', mode);
    if (!soulModal || !soulLoginForm || !soulModalTitle || !confirmPasswordField || !soulModalSubmit || !modalToggleView) {
        console.error('[Full Script] setSoulModalView: One or more crucial modal elements are missing. Aborting.');
        return;
    }
    soulLoginForm.reset(); 
    modalFeedback.textContent = '';
    soulModal.dataset.mode = mode;

    if (mode === 'register') {
        soulModalTitle.textContent = 'Claim Your Immortality';
        confirmPasswordField.style.display = 'block';
        confirmPasswordField.querySelector('input').required = true;
        soulModalSubmit.textContent = 'Begin Your Eternity';
        modalToggleView.innerHTML = switchToLoginLinkHTML;
    } else { // Default to login
        soulModalTitle.textContent = 'Enter the Sanctuary';
        confirmPasswordField.style.display = 'none';
        confirmPasswordField.querySelector('input').required = false;
        soulModalSubmit.textContent = 'Transcend';
        modalToggleView.innerHTML = switchToRegisterLinkHTML;
    }
}

function openSoulModal(mode = 'login') {
    console.log('[Full Script] openSoulModal called with mode:', mode);
    if (!soulModal) {
        console.error('[Full Script] openSoulModal: soulModal element not found!');
        return;
    }
    setSoulModalView(mode);
    soulModal.style.display = 'flex';
    const usernameInput = soulModal.querySelector('input[name="username"]');
    if (usernameInput) usernameInput.focus(); else console.warn('[Full Script] Username input not found in soulModal for focusing.');
}

function closeSoulModal() {
    console.log('[Full Script] closeSoulModal called');
    if (!soulModal || !soulLoginForm || !modalFeedback) {
        console.error('[Full Script] closeSoulModal: One or more crucial modal elements are missing. Aborting.');
        return;
    }
    soulModal.style.display = 'none';
    modalFeedback.textContent = '';
    soulLoginForm.reset();
}

// Update auth UI elements
async function updateAuthUI(isAuthenticated) {
    console.log('[Full Script] Updating auth UI, authenticated:', isAuthenticated);
    const authButtonsDiv = document.querySelector('.auth-buttons'); 
    const soulButtonHeader = document.getElementById('soulButton'); // This is the button in the header
    const userMenu = document.getElementById('userMenu');
    const heroSignupButton = document.getElementById('heroSignupButton');
    const heroLoginButton = document.getElementById('heroLoginButton');
    const usernameDisplay = document.getElementById('usernameDisplay');

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
            // The soulButton in the header, when logged out, should open the modal for login.
            // Its text can be static or updated here.
            soulButtonHeader.querySelector('.icon').innerHTML = '👻'; 
            soulButtonHeader.querySelector('.label').textContent = 'Enter / Join';
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

// --- Initial Setup ---
function init() {
    console.log('[Full Script] Initializing MLNF script...');

    // Ensure soulModal elements are defined globally or passed if needed
    if (!soulModal) {
        console.error('[Full Script] init: soulModal element not found. Modal will not function.');
        return; // Critical failure
    }

    // Main Soul Button in header (for logged-out state to open modal)
    const soulButtonHeader = document.getElementById('soulButton'); 
    if (soulButtonHeader) {
        soulButtonHeader.addEventListener('click', () => {
            if (!localStorage.getItem('sessionToken')) { 
                 openSoulModal('login');
            }
            // If logged in, this button is hidden by updateAuthUI, 
            // but if somehow clicked, it shouldn't open the modal.
        });
        console.log('[Full Script] Event listener for header soulButton ATTACHED.');
    } else {
        console.warn('[Full Script] Header soulButton not found.');
    }

    // Soul Modal Form Submission
    if (soulLoginForm) {
        soulLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if(!modalFeedback || !soulModalSubmit) return;
            modalFeedback.textContent = '';
            soulModalSubmit.disabled = true;
            soulModalSubmit.textContent = 'Summoning...';

            const mode = soulModal.dataset.mode;
            const username = this.username.value.trim();
            const password = this.password.value;

            try {
                let response;
                let payload = { username, password };

                if (mode === 'register') {
                    const confirmPassword = this.confirmPassword.value;
                    if (password !== confirmPassword) {
                        throw new Error('Ethereal Keys do not align.');
                    }
                    response = await fetch(`${API_URL}/auth/register`, { // Corrected endpoint to /register
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'An unforeseen rift occurred.');
                }

                if (mode === 'register') {
                    if (data.message && data.message.includes('successful')) { // Or check for specific success indicator
                         modalFeedback.textContent = 'Immortality claimed! Please enter the Sanctuary.';
                         setSoulModalView('login'); 
                    } else {
                        // If registration didn't return a token directly, but was successful
                        modalFeedback.textContent = data.message || 'Registration processed. Please login.';
                        setSoulModalView('login');
                    }
                } else { // Login mode
                    if (data.token) {
                        localStorage.setItem('sessionToken', data.token);
                        closeSoulModal();
                        updateAuthUI(true);
                    } else {
                        throw new Error(data.message || 'Login failed: No token received.');
                    }
                }
            } catch (err) {
                modalFeedback.textContent = err.message;
                // Restore button text based on mode if error
                if(soulModalSubmit) soulModalSubmit.textContent = mode === 'register' ? 'Begin Your Eternity' : 'Transcend';
            } finally {
                if(soulModalSubmit) soulModalSubmit.disabled = false;
            }
        });
        console.log('[Full Script] Event listener for soulLoginForm submission ATTACHED.');
    } else {
        console.error('[Full Script] soulLoginForm not found. Cannot setup submission.');
    }

    // Modal Close: X button
    const closeModalButton = soulModal.querySelector('.close-modal');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeSoulModal);
        console.log('[Full Script] Event listener for modal X button ATTACHED.');
    } else {
        console.error('[Full Script] .close-modal button not found in soulModal.');
    }

    // Modal Close: Outside click
    soulModal.addEventListener('click', (e) => { 
        if (e.target === soulModal) closeSoulModal(); 
    });
    console.log('[Full Script] Event listener for modal outside click ATTACHED.');

    // Modal View Toggle Links (Event Delegation)
    if (modalToggleView) {
        modalToggleView.addEventListener('click', (event) => {
            console.log('[Full Script] Click in modalToggleView. Target:', event.target.id);
            if (event.target.tagName === 'A') { // Ensure it's the link itself
                event.preventDefault();
                if (event.target.id === 'switchToRegisterLink') {
                    setSoulModalView('register');
                } else if (event.target.id === 'switchToLoginLink') {
                    setSoulModalView('login');
                }
            }
        });
        console.log('[Full Script] Event listener for modal view toggle ATTACHED to modalToggleView.');
    } else {
        console.error('[Full Script] modalToggleView not found. View toggling will fail.');
    }

    // User Menu Dropdown Toggle
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            userDropdown.classList.toggle('active');
        });
        window.addEventListener('click', (event) => {
            if (userMenu && !userMenuButton.contains(event.target) && !userDropdown.contains(event.target)){
                userDropdown.classList.remove('active');
            }
        });
        console.log('[Full Script] User menu dropdown listeners ATTACHED.');
    }

    // Logout Link
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            if(userDropdown) userDropdown.classList.remove('active'); 
        });
        console.log('[Full Script] Logout link listener ATTACHED.');
    }
    
    // Initial auth state check and UI update, and initial modal view setup
    checkToken().then(isAuthenticated => {
        updateAuthUI(isAuthenticated);
        setSoulModalView('login'); // Ensure modal is initialized to login view correctly
    });

    for(let i=0; i<15; i++) createParticle(); 
}

// Ensure init() is called after DOM is ready
document.addEventListener('DOMContentLoaded', init);

*/