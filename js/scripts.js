// Backend API URL
const API_URL = 'https://mlnf-auth.onrender.com/api';

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkTheme', isDark ? 'true' : 'false');
    });
}

// Check if dark theme is enabled in localStorage
if (localStorage.getItem('darkTheme') === 'true') {
    document.body.classList.add('dark-theme');
    if (themeToggle) {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');
if (mobileMenuBtn) {
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
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 10000);
}
setInterval(createParticle, 500);

// Sidebar toggle
const showUsersBtn = document.getElementById('showUsersBtn');
const activeUsers = document.getElementById('activeUsers');
const closeUsers = document.getElementById('closeUsers');

if (showUsersBtn) {
showUsersBtn.addEventListener('click', () => {
    activeUsers.classList.toggle('active');
        fetchOnlineUsers();
    });
    }

if (closeUsers) {
closeUsers.addEventListener('click', () => {
    activeUsers.classList.remove('active');
});
}

// Fetch online users with retry
async function fetchOnlineUsers(retryCount = 3, delay = 1000) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '<p class="modal-loading">Summoning eternal seekers... <span class="spinner"></span></p>';

    const token = localStorage.getItem('sessionToken');
    console.log('Fetching online users with token:', token ? token.substring(0, 10) + '...' : 'No token');

    if (!token) {
        userList.innerHTML = '<p class="modal-error">Please login to view seekers. Redirecting...</p>';
        setTimeout(() => window.location.href = 'pages/auth.html?mode=login', 2000);
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
                    userList.innerHTML = '<p class="modal-error">Session expired. Redirecting to login...</p>';
                    localStorage.removeItem('sessionToken');
                    setTimeout(() => window.location.href = 'pages/auth.html?mode=login', 2000);
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
const closeMessageModal = document.getElementById('closeMessageModal');

function openMessageModal(username) {
    recipientName.textContent = username;
    messageHistory.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';
    messageModal.style.display = 'block';
    loadMessages(username);
}

async function loadMessages(recipient) {
    // Placeholder for message fetching logic
    messageHistory.innerHTML = `
        <div class="message-bubble received">
            Greetings, eternal seeker! <small>${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="message-bubble sent">
            Hail, fellow spirit! <small>${new Date().toLocaleTimeString()}</small>
        </div>
    `;
}

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

closeMessageModal.addEventListener('click', () => {
    messageModal.style.display = 'none';
    messageInput.value = '';
    messageHistory.innerHTML = '';
});

// Token validation
async function checkToken() {
    const token = localStorage.getItem('sessionToken');
    console.log('Checking token:', token ? token.substring(0, 10) + '...' : 'No token');
    if (!token) {
        console.warn('No session token found');
        return false;
    }

    try {
        console.log('Validating token with backend...');
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Token check response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });
        if (!response.ok) {
            console.warn('Token validation failed with status:', response.status);
            localStorage.removeItem('sessionToken');
            return false;
        }
        console.log('Token is valid, user is authenticated');
        return true;
    } catch (error) {
        console.error('Token check error:', error.message, error.stack);
        localStorage.removeItem('sessionToken');
        return false;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('sessionToken');
    console.log('User logged out');
    updateAuthUI(false);
    window.location.href = 'index.html';
}

// Update auth UI elements
async function updateAuthUI(isAuthenticated) {
    console.log('Updating auth UI, authenticated:', isAuthenticated);
    const signupButton = document.getElementById('signupButton');
    const userMenu = document.getElementById('userMenu');
    const heroSignupButton = document.getElementById('heroSignupButton');
    const heroLoginButton = document.getElementById('heroLoginButton');
    
    if (isAuthenticated) {
        // User is logged in - show user menu, update hero buttons
        console.log('Updating UI for authenticated user');
        if (signupButton) signupButton.style.display = 'none';
        if (userMenu) userMenu.style.display = 'inline-block';
        
        // Update hero buttons if they exist
        if (heroSignupButton) heroSignupButton.textContent = 'Return to Hearth';
        if (heroSignupButton) heroSignupButton.href = 'lander.html';
        if (heroLoginButton) heroLoginButton.textContent = 'Explore Realms';
        if (heroLoginButton) heroLoginButton.href = 'pages/profiles.html';
        
        // Get and display username
        const user = await fetchCurrentUser();
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (user && usernameDisplay) {
            usernameDisplay.textContent = user.username || 'Immortal';
        }
        
        // Update soul freed button
        const freeSoulBtn = document.getElementById('freeSoulBtn');
        if (freeSoulBtn) {
            console.log('Updating Free Soul button state');
            freeSoulBtn.dataset.state = 'unlocked';
            freeSoulBtn.innerHTML = '<i class="fas fa-door-open"></i><span class="btn-text">Return to Mortality</span><div class="soul-status" aria-hidden="true"></div>';
        }
    } else {
        // User is logged out - show signup button, hide user menu
        console.log('Updating UI for unauthenticated user');
        if (signupButton) signupButton.style.display = 'inline-block';
        if (userMenu) userMenu.style.display = 'none';
        
        // Reset hero buttons if they exist
        if (heroSignupButton) heroSignupButton.textContent = 'Embrace Immortality';
        if (heroSignupButton) heroSignupButton.href = 'pages/auth.html?mode=signup';
        if (heroLoginButton) heroLoginButton.textContent = 'Enter The Sanctuary';
        if (heroLoginButton) heroLoginButton.href = 'pages/auth.html?mode=login';
        
        // Reset soul freed button
        const freeSoulBtn = document.getElementById('freeSoulBtn');
        if (freeSoulBtn) {
            console.log('Updating Free Soul button state');
            freeSoulBtn.dataset.state = 'locked';
            freeSoulBtn.innerHTML = '<i class="fas fa-lock"></i><span class="btn-text">Free Your Soul</span><div class="soul-status" aria-hidden="true"></div>';
        }
    }
}

// --- Soul Button and Modal Logic ---
function setSoulButtonState(state) {
  const btn = document.getElementById('soulButton');
  btn.classList.remove('locked', 'unlocked', 'loading');
  btn.classList.add(state);
  btn.setAttribute('aria-pressed', state === 'unlocked' ? 'true' : 'false');
  const icon = btn.querySelector('.icon');
  if (state === 'locked') {
    icon.textContent = '👻';
    btn.querySelector('.label').textContent = 'Enter';
  } else if (state === 'unlocked') {
    icon.textContent = '🚪';
    btn.querySelector('.label').textContent = 'Return to Mortality';
  } else if (state === 'loading') {
    icon.textContent = '';
    btn.querySelector('.label').textContent = 'Checking...';
  }
}

function openSoulModal() {
  document.getElementById('soulModal').style.display = 'flex';
  document.getElementById('soulModal').focus();
}
function closeSoulModal() {
  document.getElementById('soulModal').style.display = 'none';
  document.getElementById('modalFeedback').textContent = '';
}

document.getElementById('soulButton').addEventListener('click', function() {
  if (this.classList.contains('locked')) {
    openSoulModal();
  } else if (this.classList.contains('unlocked')) {
    setSoulButtonState('loading');
    setTimeout(() => {
      localStorage.removeItem('sessionToken');
      window.location.reload();
    }, 800);
  }
});

document.querySelector('.close-modal').addEventListener('click', closeSoulModal);
document.getElementById('soulModal').addEventListener('click', function(e) {
  if (e.target === this) closeSoulModal();
});

document.getElementById('soulLoginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  setSoulButtonState('loading');
  document.getElementById('modalFeedback').textContent = '';
  const username = this.username.value.trim();
  const password = this.password.value;
  // Replace with your real API call:
  try {
    // Simulate API call
    await new Promise(res => setTimeout(res, 1200));
    // TODO: Replace with real authentication logic!
    if (username === 'immortal' && password === 'eternal') {
      localStorage.setItem('sessionToken', 'demo-token');
      closeSoulModal();
      setSoulButtonState('unlocked');
      setTimeout(() => window.location.reload(), 800);
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (err) {
    setSoulButtonState('locked');
    document.getElementById('modalFeedback').textContent = err.message;
  }
});

setSoulButtonState('loading');
setTimeout(() => {
  // Replace with your real token check:
  const token = localStorage.getItem('sessionToken');
  setSoulButtonState(token ? 'unlocked' : 'locked');
}, 800);

// Initialize
async function init() {
    console.log('Initializing MLNF');
    const isAuthenticated = await checkToken();
    console.log('Authentication check result:', isAuthenticated);
    updateAuthUI(isAuthenticated);
    
    // Free Your Soul button handler
    document.addEventListener('DOMContentLoaded', function() {
        document.addEventListener('click', function(e) {
            // Support clicks on the button or its children (icon/span)
            let btn = e.target;
            // Traverse up to the button if a child element was clicked
            while (btn && btn.id !== 'freeSoulBtn' && btn !== document.body) {
                btn = btn.parentElement;
            }
            if (btn && btn.id === 'freeSoulBtn') {
                console.log('Delegated click! State:', btn.dataset.state);
                if (btn.dataset.state === 'locked') {
                    window.location.href = 'pages/auth.html?mode=login';
                } else {
                    localStorage.removeItem('sessionToken');
                    window.location.reload();
                }
            }
        });
    });
    
    // Toggle user dropdown on mobile
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', () => {
            userDropdown.classList.toggle('active');
        });
    }
    
        // Check current user's online status and refresh sidebar if open
    if (isAuthenticated && activeUsers.classList.contains('active')) {
            fetchOnlineUsers();
    }
}
init();