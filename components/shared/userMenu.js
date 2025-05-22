// userMenu.js - Handles the user dropdown menu functionality

// Constants
const API_BASE_URL = 'https://mlnf-auth.onrender.com/api';
const DEFAULT_AVATAR = '/assets/images/default-avatar.png';

// Update user dropdown menu based on authentication status
function updateUserMenu() {
  const userMenuContainer = document.getElementById('userMenu');
  if (!userMenuContainer) return;
  
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');

  // Create the basic user menu button
  const userMenuBtn = document.createElement('button');
  userMenuBtn.className = 'user-menu-btn';
  userMenuBtn.id = 'userMenuBtn';
  
  // Create dropdown container
  const userDropdown = document.createElement('div');
  userDropdown.className = 'user-dropdown';
  userDropdown.id = 'userDropdown';
  
  if (token && cachedUser) {
    // User is logged in - parse user data
    try {
      const userData = JSON.parse(cachedUser);
      
      // Update the button content for logged-in user
      userMenuBtn.innerHTML = `
        <img src="${userData.avatar || DEFAULT_AVATAR}" alt="User Avatar" id="userMenuAvatar">
        <span id="userMenuName">${userData.displayName || userData.username || 'Soul Seeker'}</span>
        <i class="fas fa-chevron-down"></i>
      `;
      
      // Set the dropdown content for logged-in user
      const currentPath = window.location.pathname;
      const hideEternalSouls = currentPath === '/souls' || currentPath.startsWith('/souls/');
      
      userDropdown.innerHTML = `
        <a href="/profile"><i class="fas fa-user"></i> My Soul</a>
        <a href="/pages/profile-setup.html"><i class="fas fa-cog"></i> Edit Profile</a>
        <div class="divider"></div>
        <a href="/lander.html"><i class="fas fa-fire"></i> Eternal Hearth</a>
        ${!hideEternalSouls ? '<a href="/souls"><i class="fas fa-users"></i> Eternal Souls</a>' : ''}
        <div class="divider"></div>
        <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Transcend Session</a>
      `;
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      setGuestUserMenu(userMenuBtn, userDropdown);
    }
  } else {
    // Guest user menu
    setGuestUserMenu(userMenuBtn, userDropdown);
  }
  
  // Clear and append the new user menu components
  userMenuContainer.innerHTML = '';
  userMenuContainer.appendChild(userMenuBtn);
  userMenuContainer.appendChild(userDropdown);
  
  // Set up event listeners
  setupUserMenuEvents();
}

// Set guest user menu content
function setGuestUserMenu(button, dropdown) {
  // Set button content
  button.innerHTML = `
    <img src="${DEFAULT_AVATAR}" alt="Guest Avatar" id="userMenuAvatar">
    <span id="userMenuName">Guest</span>
    <i class="fas fa-chevron-down"></i>
  `;
  
  // Set dropdown content
  const currentPath = window.location.pathname;
  const hideEternalSouls = currentPath === '/souls' || currentPath.startsWith('/souls/');
  
  dropdown.innerHTML = `
    <a href="#" id="guestLoginBtn"><i class="fas fa-sign-in-alt"></i> Login</a>
    <a href="#" id="guestRegisterBtn"><i class="fas fa-user-plus"></i> Register</a>
    <div class="divider"></div>
    <a href="/lander.html"><i class="fas fa-fire"></i> Eternal Hearth</a>
    ${!hideEternalSouls ? '<a href="/souls"><i class="fas fa-users"></i> Eternal Souls</a>' : ''}
  `;
}

// Setup event listeners for user menu
function setupUserMenuEvents() {
  // Toggle dropdown on button click
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', () => {
      userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
        userDropdown.classList.remove('active');
      }
    });
  }
  
  // Handle logout click
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Handle login/register for guests
  const guestLoginBtn = document.getElementById('guestLoginBtn');
  const guestRegisterBtn = document.getElementById('guestRegisterBtn');
  
  if (guestLoginBtn) {
    guestLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.MLNF && window.MLNF.openSoulModal) {
        window.MLNF.openSoulModal('login');
      }
    });
  }
  
  if (guestRegisterBtn) {
    guestRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.MLNF && window.MLNF.openSoulModal) {
        window.MLNF.openSoulModal('register');
      }
    });
  }
  
  // Also update mobile navigation login/logout links
  updateMobileAuthLinks();
}

// Update mobile navigation auth links
function updateMobileAuthLinks() {
  const token = localStorage.getItem('sessionToken');
  
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  const mobileProfileLink = document.getElementById('mobileProfileLink');
  
  if (mobileLoginBtn && mobileRegisterBtn && mobileLogoutBtn) {
    if (token) {
      // Show logout, hide login/register
      mobileLoginBtn.style.display = 'none';
      mobileRegisterBtn.style.display = 'none';
      mobileLogoutBtn.style.display = 'flex';
      if (mobileProfileLink) mobileProfileLink.style.display = 'flex';
      
      // Add logout handler
      mobileLogoutBtn.addEventListener('click', handleLogout);
    } else {
      // Show login/register, hide logout
      mobileLoginBtn.style.display = 'flex';
      mobileRegisterBtn.style.display = 'flex';
      mobileLogoutBtn.style.display = 'none';
      if (mobileProfileLink) mobileProfileLink.style.display = 'none';
      
      // Add login/register handlers
      mobileLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.MLNF && window.MLNF.openSoulModal) {
          window.MLNF.openSoulModal('login');
        }
      });
      
      mobileRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.MLNF && window.MLNF.openSoulModal) {
          window.MLNF.openSoulModal('register');
        }
      });
    }
  }
}

// Handle user logout
function handleLogout() {
  console.log("Logout initiated");
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
  
  // Update UI to reflect logged-out state
  updateUserMenu();
  
  // Update user sidebar if it exists
  if (window.MLNF && window.MLNF.updateUserSidebar) {
    window.MLNF.updateUserSidebar();
  }
  
  // Redirect to landing page
  window.location.href = '/lander.html';
}

// Check if token exists but user data is missing, then fetch user data
async function validateUserSession() {
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');
  
  if (token && !cachedUser) {
    try {
      // Token exists but no user data, try to fetch user data
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Retrieved user data from API');
      } else {
        // Token might be invalid
        console.log('Invalid token, removing session data');
        localStorage.removeItem('sessionToken');
      }
    } catch (error) {
      console.error('Error validating user session:', error);
    }
    
    // Update UI regardless of outcome
    updateUserMenu();
  }
}

// Initialize user menu
function initUserMenu() {
  validateUserSession().then(() => {
    updateUserMenu();
  });
}

// Export the initialization function
window.MLNF = window.MLNF || {};
window.MLNF.initUserMenu = initUserMenu;
window.MLNF.updateUserMenu = updateUserMenu; 