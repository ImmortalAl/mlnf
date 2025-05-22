// mlnf-core.js - Core initialization for MLNF components

// Load and initialize all components
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation
  if (window.MLNF && window.MLNF.initNavigation) {
    window.MLNF.initNavigation();
    console.log('MLNF Navigation initialized');
  } else {
    console.error('MLNF Navigation component not loaded');
  }
  
  // Initialize user menu
  if (window.MLNF && window.MLNF.initUserMenu) {
    window.MLNF.initUserMenu();
    console.log('MLNF User Menu initialized');
  } else {
    console.error('MLNF User Menu component not loaded');
  }
  
  // Initialize user sidebar
  if (window.MLNF && window.MLNF.initUserSidebar) {
    window.MLNF.initUserSidebar();
    console.log('MLNF User Sidebar initialized');
  } else {
    console.error('MLNF User Sidebar component not loaded');
  }
  
  // Initialize auth modal
  if (window.MLNF && window.MLNF.initAuthModal) {
    window.MLNF.initAuthModal();
    console.log('MLNF Auth Modal initialized');
  } else {
    console.error('MLNF Auth Modal component not loaded');
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
    
    if (window.MLNF && window.MLNF.updateUserSidebar) {
      window.MLNF.updateUserSidebar();
    }
  }
});

// Export namespace
window.MLNF = window.MLNF || {}; 