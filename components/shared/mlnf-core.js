// mlnf-core.js - Core initialization for MLNF components

// Load and initialize all components
document.addEventListener('DOMContentLoaded', () => {
  console.log('[mlnf-core.js] DOM fully loaded and parsed');

  // Initialize user menu FIRST, so its functions are available to other components like navigation
  if (window.MLNF && window.MLNF.initUserMenu) {
    window.MLNF.initUserMenu();
    console.log('MLNF User Menu initialized');
  } else {
    console.warn('MLNF User Menu component not loaded');
  }

  // Initialize navigation
  if (window.MLNF && window.MLNF.initNavigation) {
    window.MLNF.initNavigation();
    console.log('MLNF Navigation initialized');
  } else {
    console.warn('MLNF Navigation component not loaded');
  }
  
  // Initialize active users sidebar
  if (window.MLNF && window.MLNF.initActiveUsers) {
    window.MLNF.initActiveUsers();
    console.log('MLNF Active Users Sidebar initialized');
  } else {
    console.warn('MLNF Active Users Sidebar component not loaded');
  }
  
  // Initialize auth modal
  if (window.MLNF && window.MLNF.initAuthModal) {
    window.MLNF.initAuthModal();
    console.log('MLNF Auth Modal initialized');
  } else {
    console.warn('MLNF Auth Modal component not loaded');
  }

  // Initialize Hero Particles
  if (window.MLNF && window.MLNF.initHeroParticles) {
    window.MLNF.initHeroParticles(350); // Create a new particle roughly every 350ms
    console.log('MLNF Hero Particles initialized');
  } else {
    console.warn('MLNF Hero Particles component not loaded');
  }

  // Initialize Message Modal
  if (window.MLNF && window.MLNF.initMessageModal) {
    window.MLNF.initMessageModal();
    console.log('MLNF Message Modal initialized');
  } else {
    console.warn('MLNF Message Modal component not loaded');
  }
  
  console.log('MLNF Core components initialized');
});

// Listen for changes to authentication state
window.addEventListener('storage', (event) => {
  // When session token changes in another tab/window
  if (event.key === 'sessionToken' || event.key === 'user') {
    console.log('Authentication state changed in another window');
    
    // Update UI components
    if (window.MLNF && window.MLNF.updateUserMenu) {
      window.MLNF.updateUserMenu();
    }
    
    // No longer updating userSidebar as it's removed
    // if (window.MLNF && window.MLNF.updateUserSidebar) {
    //   window.MLNF.updateUserSidebar();
    // }
  }
});

// Export namespace
window.MLNF = window.MLNF || {}; 