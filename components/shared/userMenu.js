// userMenu.js - Handles the user dropdown menu functionality

// Constants are now in config.js and accessed via window.MLNF_CONFIG
// const API_BASE_URL = 'https://mlnf-auth.onrender.com/api'; // REMOVED
// const DEFAULT_AVATAR = '/assets/images/default-avatar.png'; // REMOVED

// Update user dropdown menu based on authentication status
function updateUserMenu() {
  const API_BASE_URL = window.MLNF_CONFIG.API_BASE_URL;
  const DEFAULT_AVATAR = window.MLNF_CONFIG.DEFAULT_AVATAR;
  console.log('[userMenu.js] updateUserMenu called.');
  
  const userMenuContainer = document.getElementById('userMenuContainer');
  const headerAuthButtonsContainer = document.getElementById('headerAuthButtonsContainer');

  if (!userMenuContainer || !headerAuthButtonsContainer) {
    console.warn('[userMenu.js] #userMenuContainer or #headerAuthButtonsContainer not found. UI not fully updated.');
    return;
  }
  
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');
  console.log(`[userMenu.js] Token: ${token ? 'Exists' : 'null'}, CachedUser: ${cachedUser ? 'Exists' : 'null'}`);

  if (token && cachedUser) {
    console.log('[userMenu.js] User is logged in.');
    userMenuContainer.style.display = 'flex'; // Or 'block' or 'inline-block' depending on desired layout
    headerAuthButtonsContainer.style.display = 'none';
    headerAuthButtonsContainer.innerHTML = ''; // Clear any old buttons

    const userMenuBtn = document.createElement('button');
    userMenuBtn.className = 'user-menu-btn';
    userMenuBtn.id = 'userMenuBtn';
    
    const userDropdown = document.createElement('div');
    userDropdown.className = 'user-dropdown';
    userDropdown.id = 'userDropdown';
    userDropdown.classList.remove('active');

    try {
      const userData = JSON.parse(cachedUser);
      userMenuBtn.innerHTML = `
        <img src="${userData.avatar || DEFAULT_AVATAR}" alt="User Avatar" id="userMenuAvatar">
        <span id="userMenuName">${userData.displayName || userData.username || 'Soul Seeker'}</span>
        <i class="fas fa-chevron-down"></i>
      `;
      
      userDropdown.innerHTML = `
        <a href="/profile"><i class="fas fa-user"></i> My Soul</a>
        <a href="/pages/profile-setup.html"><i class="fas fa-cog"></i> Edit Profile</a>
        <div class="divider"></div>
        <a href="/lander.html"><i class="fas fa-fire"></i> Eternal Hearth</a>
        ${userData.username === 'ImmortalAl' || userData.role === 'admin' ? `
        <div class="divider"></div>
        <a href="/admin/"><i class="fas fa-crown"></i> Admin Panel</a>
        ` : ''}
        <div class="divider"></div>
        <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Transcend Session</a>
      `;
      
      userMenuContainer.innerHTML = ''; 
      userMenuContainer.appendChild(userMenuBtn);
      userMenuContainer.appendChild(userDropdown);

    } catch (error) {
      console.error('[userMenu.js] Error parsing user data:', error);
      // Fallback to logged-out state if error
      userMenuContainer.style.display = 'none';
      userMenuContainer.innerHTML = '';
      headerAuthButtonsContainer.style.display = 'flex'; // Assuming flex for column layout
      populateHeaderAuthButtons(headerAuthButtonsContainer);
    }
  } else {
    console.log('[userMenu.js] User is guest.');
    userMenuContainer.style.display = 'none';
    userMenuContainer.innerHTML = ''; // Clear it
    headerAuthButtonsContainer.style.display = 'flex'; // Assuming flex for column layout
    populateHeaderAuthButtons(headerAuthButtonsContainer);
  }
  
  if (window.MLNF && window.MLNF.updateActiveUsersButtonVisibility) {
    window.MLNF.updateActiveUsersButtonVisibility();
  }
  
  setupUserMenuEvents(); // Sets up dropdown toggle and logout
  // Event listeners for new header buttons are set in populateHeaderAuthButtons
}

function populateHeaderAuthButtons(container) {
  container.innerHTML = `
    <a href="#" class="btn btn-primary" id="headerSignupButton">Embrace Immortality</a>
    <a href="#" class="btn btn-outline" id="headerLoginButton">Enter Sanctuary</a>
  `;
  const headerSignupButton = document.getElementById('headerSignupButton');
  const headerLoginButton = document.getElementById('headerLoginButton');

  if (headerSignupButton) {
    headerSignupButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[userMenu.js] Signup button clicked. MLNF object:', window.MLNF);
      console.log('[userMenu.js] openSoulModal function:', window.MLNF ? window.MLNF.openSoulModal : 'MLNF not found');
      if (window.MLNF && window.MLNF.openSoulModal) {
        window.MLNF.openSoulModal('register');
      } else {
        console.error('[userMenu.js] openSoulModal function not available!');
        alert('Registration modal not available. Please refresh the page.');
      }
    });
  }
  if (headerLoginButton) {
    headerLoginButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[userMenu.js] Login button clicked. MLNF object:', window.MLNF);
      console.log('[userMenu.js] openSoulModal function:', window.MLNF ? window.MLNF.openSoulModal : 'MLNF not found');
      if (window.MLNF && window.MLNF.openSoulModal) {
        window.MLNF.openSoulModal('login');
      } else {
        console.error('[userMenu.js] openSoulModal function not available!');
        alert('Login modal not available. Please refresh the page.');
      }
    });
  }
}

// Setup event listeners for user menu (dropdown toggle, logout)
function setupUserMenuEvents() {
  console.log('[userMenu.js] setupUserMenuEvents called.');
  const userMenuBtn = document.getElementById('userMenuBtn'); // This might not exist if logged out
  const userDropdown = document.getElementById('userDropdown'); // This might not exist if logged out

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', () => {
      userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
      if (!userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
        if (userDropdown.classList.contains('active')) {
          userDropdown.classList.remove('active');
        }
      }
    });
  }
  
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Handle user logout
function handleLogout() {
  console.log("Logout initiated");
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
  
  updateUserMenu(); // This will also trigger updateActiveUsersButtonVisibility
  
  // No updateUserSidebar to call
  
  window.location.href = '/'; // Redirect to home page after logout
}

// Check if token exists but user data is missing, then fetch user data
async function validateUserSession() {
  const API_BASE_URL = window.MLNF_CONFIG.API_BASE_URL;
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');
  
  if (token && !cachedUser) {
    try {
      console.log('[userMenu.js] Token found, but no cached user. Fetching user data...');
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[userMenu.js] User data fetched and cached.');
      } else {
        // If fetching user data fails (e.g., token invalid), clear token
        console.warn('[userMenu.js] Failed to fetch user data with existing token. Clearing token.');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user'); // Also clear potentially stale user data
      }
    } catch (error) {
      console.error('[userMenu.js] Error fetching user data for session validation:', error);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
    }
  }
  updateUserMenu(); // This will also trigger updateActiveUsersButtonVisibility
}

// Initialize user menu
function initUserMenu() {
  validateUserSession(); // Validate and then update UI
  // updateUserMenu(); // This is now called by validateUserSession
}

// Export the initialization function
window.MLNF = window.MLNF || {};
window.MLNF.initUserMenu = initUserMenu;
window.MLNF.updateUserMenu = updateUserMenu; // Expose for mlnf-core.js storage listener
window.MLNF.handleLogout = handleLogout; // Expose if needed by other components, e.g. mobile menu

// Function to update mobile auth links - DISABLED: Mobile nav should only contain navigation links
function updateMobileAuthLinks() {
    // Mobile navigation should only contain navigation links, not user auth functions
    // User authentication is handled through the header user menu dropdown
    console.log('[userMenu.js] updateMobileAuthLinks called but disabled - mobile nav is for navigation only');
    return;
}
// Make sure setupMobileAuthClickHandlers can be called by navigation.js if it's responsible for main link injection
window.MLNF.setupMobileAuthClickHandlers = updateMobileAuthLinks;
window.MLNF.updateMobileAuthLinks = updateMobileAuthLinks;