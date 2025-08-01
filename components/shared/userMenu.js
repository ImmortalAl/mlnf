// userMenu.js - Handles the user dropdown menu functionality

// Constants are now in config.js and accessed via window.MLNF_CONFIG
// const API_BASE_URL = 'https://mlnf-auth.onrender.com/api'; // REMOVED
// const DEFAULT_AVATAR = '/assets/images/default-avatar.png'; // REMOVED

// Update user dropdown menu based on authentication status
function updateUserMenu() {
  
  const API_BASE_URL = window.MLNF_CONFIG.API_BASE_URL;
  const DEFAULT_AVATAR = window.MLNF_CONFIG.DEFAULT_AVATAR;
  
  const userMenuContainer = document.getElementById('userMenuContainer');
  const headerAuthButtonsContainer = document.getElementById('headerAuthButtonsContainer');

  if (!userMenuContainer || !headerAuthButtonsContainer) {
    return; // Silently skip if elements not found
  }
  
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');

  if (token && cachedUser) {
    document.body.classList.add('user-logged-in');
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
        <a href="/lander.html"><i class="fas fa-fire"></i> Eternal Hearth</a>
        ${userData.username === 'ImmortalAl' || userData.role === 'admin' ? `
        <div class="divider"></div>
        <a href="/admin/"><i class="fas fa-crown"></i> Admin Panel</a>
        ` : ''}
        <div class="divider"></div>
        <a href="#" id="themeToggleMenu"><i class="fas fa-moon"></i> <span id="themeToggleText">Light Mode</span></a>
        <div class="divider"></div>
        <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Transcend Session</a>
      `;
      
      userMenuContainer.innerHTML = ''; 
      userMenuContainer.appendChild(userMenuBtn);
      userMenuContainer.appendChild(userDropdown);

    } catch (error) {
      console.error('[userMenu.js] Error parsing user data:', error);
      // Fallback to logged-out state if error
      document.body.classList.remove('user-logged-in');
      userMenuContainer.style.display = 'none';
      userMenuContainer.innerHTML = '';
      headerAuthButtonsContainer.style.display = 'flex'; // Assuming flex for column layout
      populateHeaderAuthButtons(headerAuthButtonsContainer);
    }
  } else {
    document.body.classList.remove('user-logged-in');
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
      console.log('[userMenu.js] Login button clicked');
      if (window.MLNF && window.MLNF.openSoulModal) {
        console.log('[userMenu.js] Calling openSoulModal with login mode');
        window.MLNF.openSoulModal('login');
      } else {
        console.error('[userMenu.js] openSoulModal function not available!');
        alert('Login modal not available. Please refresh the page.');
      }
    });
  }
}

// Update theme menu text and icon based on current theme
function updateThemeMenuText() {
  const themeToggleMenu = document.getElementById('themeToggleMenu');
  const themeToggleText = document.getElementById('themeToggleText');
  
  if (themeToggleMenu && themeToggleText && window.MLNFTheme) {
    const currentTheme = window.MLNFTheme.getTheme();
    const icon = themeToggleMenu.querySelector('i');
    
    if (currentTheme === 'dark') {
      themeToggleText.textContent = 'Light Mode';
      if (icon) icon.className = 'fas fa-sun';
    } else {
      themeToggleText.textContent = 'Dark Mode';
      if (icon) icon.className = 'fas fa-moon';
    }
  }
}

// Setup event listeners for user menu (dropdown toggle, logout)
function setupUserMenuEvents() {
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
  
  // Theme toggle menu item
  const themeToggleMenu = document.getElementById('themeToggleMenu');
  if (themeToggleMenu) {
    themeToggleMenu.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.MLNFTheme) {
        window.MLNFTheme.toggleTheme();
        updateThemeMenuText();
      }
    });
    
    // Update initial text based on current theme
    updateThemeMenuText();
  }
}

// Handle user logout
function handleLogout() {
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
  document.body.classList.remove('user-logged-in');
  
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
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
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
  
  // Listen for theme changes to update menu text
  window.addEventListener('mlnf-theme-changed', updateThemeMenuText);
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
    return;
}
// Make sure setupMobileAuthClickHandlers can be called by navigation.js if it's responsible for main link injection
window.MLNF.setupMobileAuthClickHandlers = updateMobileAuthLinks;
window.MLNF.updateMobileAuthLinks = updateMobileAuthLinks;