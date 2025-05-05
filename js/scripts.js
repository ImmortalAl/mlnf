// Backend API URL
const API_URL = 'https://mlnf-auth.onrender.com/api';

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggle.innerHTML = document.body.classList.contains('light-theme')
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
});

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');
mobileMenuBtn.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    mobileMenuBtn.innerHTML = mainNav.classList.contains('active')
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
});

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

// Soul liberation button
const freeSoulBtn = document.getElementById('freeSoulBtn');
freeSoulBtn.addEventListener('click', () => {
    if (freeSoulBtn.dataset.state === 'locked') {
        freeSoulBtn.classList.add('loading');
        freeSoulBtn.disabled = true;
        setTimeout(() => {
            freeSoulBtn.classList.remove('loading');
            freeSoulBtn.dataset.state = 'unlocked';
            freeSoulBtn.innerHTML = '<i class="fas fa-lock-open"></i><span class="btn-text">Soul Freed</span><div class="soul-status" aria-hidden="true"></div>';
            freeSoulBtn.disabled = false;
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.className = 'soul-particle';
                    particle.style.left = `${freeSoulBtn.offsetLeft + Math.random() * freeSoulBtn.offsetWidth}px`;
                    particle.style.top = `${freeSoulBtn.offsetTop + Math.random() * freeSoulBtn.offsetHeight}px`;
                    particle.style.animationDuration = `${Math.random() * 2 + 1}s`;
                    document.body.appendChild(particle);
                    setTimeout(() => particle.remove(), 3000);
                }, i * 100);
            }
        }, 2000);
    }
});

// Sidebar toggle
const showUsersBtn = document.getElementById('showUsersBtn');
const activeUsers = document.getElementById('activeUsers');
const closeUsers = document.getElementById('closeUsers');
showUsersBtn.addEventListener('click', () => {
    activeUsers.classList.toggle('active');
    if (activeUsers.classList.contains('active')) {
        fetchOnlineUsers();
    }
});
closeUsers.addEventListener('click', () => {
    activeUsers.classList.remove('active');
});

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
        return true;
    } catch (error) {
        console.error('Token check error:', error.message, error.stack);
        localStorage.removeItem('sessionToken');
        return false;
    }
}

// Update auth button
async function updateAuthButton() {
    const authButton = document.getElementById('authButton');
    const isAuthenticated = await checkToken();
    console.log('Authentication status:', isAuthenticated);
    if (isAuthenticated) {
        authButton.textContent = 'Eternal Hearth';
        authButton.href = 'lander.html';
        authButton.classList.add('btn-primary');
        authButton.classList.remove('btn-outline');
    } else {
        authButton.textContent = 'Join Eternity';
        authButton.href = 'pages/auth.html';
        authButton.classList.add('btn-primary');
        authButton.classList.remove('btn-outline');
    }
}

// Initialize
async function init() {
    console.log('Initializing MLNF');
    await updateAuthButton();
    const isAuthenticated = await checkToken();
    if (isAuthenticated) {
        freeSoulBtn.dataset.state = 'unlocked';
        freeSoulBtn.innerHTML = '<i class="fas fa-lock-open"></i><span class="btn-text">Soul Freed</span><div class="soul-status" aria-hidden="true"></div>';
        // Check current user's online status and refresh sidebar if open
        const currentUser = await fetchCurrentUser();
        if (currentUser && currentUser.online && activeUsers.classList.contains('active')) {
            fetchOnlineUsers();
        }
    }
}
init();