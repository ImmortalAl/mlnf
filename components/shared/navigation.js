// navigation.js - Handles the consistent navigation bar across the site

// Dynamically creates and injects the navigation HTML
function injectNavigation() {
  // Get the current path to highlight active links
  const currentPath = window.location.pathname;
  
  // Create navigation HTML with conditional active class
  const navHTML = `
    <div class="logo">
      <i class="fas fa-infinity"></i>
      <h1>MLNF</h1>
    </div>
    <button class="mobile-nav-toggle" id="mobileNavToggle">
      <i class="fas fa-bars"></i>
    </button>
    <nav>
      <ul>
        <li><a href="/" class="${currentPath === '/' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a></li>
        <li><a href="/lander.html" class="${currentPath === '/lander.html' ? 'active' : ''}"><i class="fas fa-fire"></i> Eternal Hearth</a></li>
        <li><a href="/souls" class="${currentPath === '/souls' || currentPath.startsWith('/souls/') ? 'active' : ''}"><i class="fas fa-users"></i> Eternal Souls</a></li>
        <li><a href="/pages/blog.html" class="${currentPath === '/pages/blog.html' ? 'active' : ''}"><i class="fas fa-scroll"></i> Soul Scrolls</a></li>
        <li><a href="/pages/messageboard.html" class="${currentPath === '/pages/messageboard.html' ? 'active' : ''}"><i class="fas fa-comments"></i> Echoes Unbound</a></li>
        <li><a href="/pages/news.html" class="${currentPath === '/pages/news.html' ? 'active' : ''}"><i class="fas fa-newspaper"></i> Boundless Chronicles</a></li>
        <li><a href="/pages/debate.html" class="${currentPath === '/pages/debate.html' ? 'active' : ''}"><i class="fas fa-gavel"></i> Clash of Immortals</a></li>
        <li><a href="/pages/mindmap.html" class="${currentPath === '/pages/mindmap.html' ? 'active' : ''}"><i class="fas fa-project-diagram"></i> Infinite Nexus</a></li>
        <li><a href="/pages/archive.html" class="${currentPath === '/pages/archive.html' ? 'active' : ''}"><i class="fas fa-vault"></i> Timeless Vault</a></li>
      </ul>
    </nav>
    <div class="user-menu" id="userMenu">
      <!-- User menu will be injected by userMenu.js -->
    </div>
  `;
  
  // Inject into header
  const header = document.querySelector('header');
  if (header) {
    header.innerHTML = navHTML;
  }

  // Also inject mobile navigation
  injectMobileNavigation();
}

// Mobile navigation injection
function injectMobileNavigation() {
  const currentPath = window.location.pathname;
  
  const mobileNavHTML = `
    <div class="mobile-overlay" id="mobileOverlay"></div>
    <nav class="mobile-nav" id="mobileNav">
      <div class="sidebar-header">
        <h2>Eternal Navigation</h2>
        <button class="close-sidebar" id="closeMobileNav">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="mobile-nav-list">
        <a href="/" class="${currentPath === '/' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a>
        <a href="/lander.html" class="${currentPath === '/lander.html' ? 'active' : ''}"><i class="fas fa-fire"></i> Eternal Hearth</a>
        <a href="/souls" class="${currentPath === '/souls' || currentPath.startsWith('/souls/') ? 'active' : ''}"><i class="fas fa-users"></i> Eternal Souls</a>
        <a href="/pages/blog.html" class="${currentPath === '/pages/blog.html' ? 'active' : ''}"><i class="fas fa-scroll"></i> Soul Scrolls</a>
        <a href="/pages/messageboard.html" class="${currentPath === '/pages/messageboard.html' ? 'active' : ''}"><i class="fas fa-comments"></i> Echoes Unbound</a>
        <a href="/pages/news.html" class="${currentPath === '/pages/news.html' ? 'active' : ''}"><i class="fas fa-newspaper"></i> Boundless Chronicles</a>
        <a href="/pages/debate.html" class="${currentPath === '/pages/debate.html' ? 'active' : ''}"><i class="fas fa-gavel"></i> Clash of Immortals</a>
        <a href="/pages/mindmap.html" class="${currentPath === '/pages/mindmap.html' ? 'active' : ''}"><i class="fas fa-project-diagram"></i> Infinite Nexus</a>
        <a href="/pages/archive.html" class="${currentPath === '/pages/archive.html' ? 'active' : ''}"><i class="fas fa-vault"></i> Timeless Vault</a>
        <div class="divider"></div>
        <a href="/profile" id="mobileProfileLink"><i class="fas fa-user"></i> My Soul</a>
        <a href="/pages/profile-setup.html"><i class="fas fa-cog"></i> Edit Profile</a>
        <div class="divider"></div>
        <a href="#" id="mobileLoginBtn"><i class="fas fa-sign-in-alt"></i> Login</a>
        <a href="#" id="mobileRegisterBtn"><i class="fas fa-user-plus"></i> Register</a>
        <a href="#" id="mobileLogoutBtn" style="display: none;"><i class="fas fa-sign-out-alt"></i> Transcend Session</a>
      </div>
    </nav>
  `;
  
  // Append to body
  const mobileNavContainer = document.createElement('div');
  mobileNavContainer.innerHTML = mobileNavHTML;
  document.body.appendChild(mobileNavContainer);
}

// Setup Mobile Navigation Events
function setupMobileNavigation() {
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNav = document.getElementById('mobileNav');
  const closeMobileNav = document.getElementById('closeMobileNav');
  const mobileOverlay = document.getElementById('mobileOverlay');
  
  if (mobileNavToggle && mobileNav && closeMobileNav && mobileOverlay) {
    mobileNavToggle.addEventListener('click', () => {
      mobileNav.classList.add('active');
      mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    closeMobileNav.addEventListener('click', () => {
      mobileNav.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    mobileOverlay.addEventListener('click', () => {
      mobileNav.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
}

// Initialize navigation
function initNavigation() {
  injectNavigation();
  setupMobileNavigation();
}

// Export the initialization function
window.MLNF = window.MLNF || {};
window.MLNF.initNavigation = initNavigation; 