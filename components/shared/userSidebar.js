// userSidebar.js - Handles the user sidebar functionality

// Constants
const DEFAULT_AVATAR = '/assets/images/default-avatar.png';

// Inject the user sidebar HTML into the page
function injectUserSidebar() {
  // Create sidebar HTML
  const sidebarHTML = `
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <div class="user-sidebar" id="userSidebar">
      <div class="sidebar-header">
        <h2>Eternal Profile</h2>
        <button class="close-sidebar" id="closeSidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="user-avatar-container">
        <img src="${DEFAULT_AVATAR}" alt="User Avatar" class="sidebar-avatar" id="sidebarAvatar">
        <h3 class="sidebar-username" id="sidebarUsername">Anonymous Soul</h3>
        <p class="sidebar-status" id="sidebarStatus">Exploring the eternal realms...</p>
      </div>
      <div class="sidebar-menu">
        <a href="/profile"><i class="fas fa-user"></i> View My Soul</a>
        <a href="/pages/profile-setup.html"><i class="fas fa-cog"></i> Edit Profile</a>
        <a href="/souls"><i class="fas fa-users"></i> Explore Souls</a>
        <a href="/pages/messageboard.html"><i class="fas fa-comments"></i> Eternal Messages</a>
        <a href="/pages/blog.html"><i class="fas fa-scroll"></i> My Scrolls</a>
      </div>
      <div class="sidebar-footer">
        <p>&copy; ${new Date().getFullYear()} Manifest Liberation, Naturally Free</p>
        <p>Embracing Infinite Potential</p>
      </div>
    </div>
    <button class="open-sidebar-btn" id="openSidebar">
      <i class="fas fa-user"></i>
    </button>
  `;
  
  // Create a container for the sidebar
  const sidebarContainer = document.createElement('div');
  sidebarContainer.innerHTML = sidebarHTML;
  
  // Append to body
  document.body.appendChild(sidebarContainer);
}

// Update sidebar content based on user authentication state
function updateUserSidebar() {
  const token = localStorage.getItem('sessionToken');
  const cachedUser = localStorage.getItem('user');
  
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarUsername = document.getElementById('sidebarUsername');
  const sidebarStatus = document.getElementById('sidebarStatus');
  const openSidebarBtn = document.getElementById('openSidebar');
  
  if (!sidebarAvatar || !sidebarUsername || !sidebarStatus || !openSidebarBtn) {
    return;
  }
  
  if (token && cachedUser) {
    try {
      const userData = JSON.parse(cachedUser);
      
      // Update sidebar with user data
      sidebarAvatar.src = userData.avatar || DEFAULT_AVATAR;
      sidebarAvatar.onerror = () => { sidebarAvatar.src = DEFAULT_AVATAR; };
      
      sidebarUsername.textContent = userData.displayName || userData.username || 'Soul Seeker';
      sidebarStatus.textContent = userData.status || 'Exploring the eternal realm...';
      
      // Show the sidebar button for logged-in users
      openSidebarBtn.style.display = 'flex';
      
    } catch (error) {
      console.error('Error parsing user data for sidebar:', error);
      setGuestSidebar();
    }
  } else {
    setGuestSidebar();
  }
}

// Set sidebar for guest users
function setGuestSidebar() {
  const openSidebarBtn = document.getElementById('openSidebar');
  if (openSidebarBtn) {
    // Hide sidebar button for guests
    openSidebarBtn.style.display = 'none';
  }
}

// Setup sidebar event listeners
function setupSidebarEvents() {
  const openSidebarBtn = document.getElementById('openSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const userSidebar = document.getElementById('userSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (openSidebarBtn && closeSidebarBtn && userSidebar && sidebarOverlay) {
    // Open sidebar
    openSidebarBtn.addEventListener('click', () => {
      userSidebar.classList.add('active');
      sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    // Close sidebar
    closeSidebarBtn.addEventListener('click', () => {
      userSidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    // Close sidebar on overlay click
    sidebarOverlay.addEventListener('click', () => {
      userSidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
}

// Initialize user sidebar
function initUserSidebar() {
  injectUserSidebar();
  setupSidebarEvents();
  updateUserSidebar();
}

// Export the initialization and update functions
window.MLNF = window.MLNF || {};
window.MLNF.initUserSidebar = initUserSidebar;
window.MLNF.updateUserSidebar = updateUserSidebar; 