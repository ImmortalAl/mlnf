// mlnf-core.js - Core initialization for MLNF components

// Establish the global namespace
window.MLNF = window.MLNF || {};

// Centralized component initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('[mlnf-core.js] Initializing all MLNF components...');

  // The order of initialization can be important.
  // For example, user menu should be initialized before components that might use it.
  
  // 1. User Menu
  if (typeof window.MLNF.initUserMenu === 'function') {
    window.MLNF.initUserMenu();
  } else {
    console.warn('Core component `initUserMenu` not found.');
  }
  
  // 2. Navigation
  if (typeof window.MLNF.initNavigation === 'function') {
    window.MLNF.initNavigation();
  } else {
    console.warn('Core component `initNavigation` not found.');
  }
  
  // 3. Auth Modal
  if (typeof window.MLNF.initAuthModal === 'function') {
    window.MLNF.initAuthModal();
  } else {
    console.warn('Core component `initAuthModal` not found.');
  }

  // 4. Message Modal
  if (typeof window.MLNF.initMessageModal === 'function') {
    window.MLNF.initMessageModal();
  } else {
    console.warn('Core component `initMessageModal` not found.');
  }
  
  // 5. Active Users Sidebar (depends on Message Modal)
  if (typeof window.MLNF.initActiveUsers === 'function') {
    window.MLNF.initActiveUsers();
  } else {
    console.warn('Core component `initActiveUsers` not found.');
  }
  
  // Optional components
  if (typeof window.MLNF.initHeroParticles === 'function') {
    window.MLNF.initHeroParticles(350);
  }

  console.log('[mlnf-core.js] All components initialized.');
});

// Listen for authentication state changes
window.addEventListener('storage', (event) => {
  if (event.key === 'sessionToken' || event.key === 'user') {
    console.log('Auth state changed in another window. Updating UI.');
    if (typeof window.MLNF.updateUserMenu === 'function') {
      window.MLNF.updateUserMenu();
    }
  }
}); 