// mlnf-core.js - Core initialization for MLNF components

// Establish the global namespace
window.MLNF = window.MLNF || {};

// Centralized component initialization
document.addEventListener('DOMContentLoaded', () => {

  // The order of initialization can be important.
  // For example, user menu should be initialized before components that might use it.
  
  // Initialize components only if their functions are available
  const components = [
    { name: 'initUserMenu', desc: 'User Menu' },
    { name: 'initNavigation', desc: 'Navigation' },
    { name: 'initAuthModal', desc: 'Auth Modal' },
    { name: 'initMessageModal', desc: 'Message Modal' },
    { name: 'initActiveUsers', desc: 'Active Users Sidebar' }
  ];

  let successfulInits = 0;
  
  components.forEach(component => {
    if (typeof window.MLNF[component.name] === 'function') {
      try {
        window.MLNF[component.name]();
        successfulInits++;
      } catch (error) {
        console.error(`Failed to initialize ${component.desc}:`, error);
      }
    }
  });

  
  // Optional components
  if (typeof window.MLNF.initHeroParticles === 'function') {
    window.MLNF.initHeroParticles(350);
  }

});

// Listen for authentication state changes
window.addEventListener('storage', (event) => {
  if (event.key === 'sessionToken' || event.key === 'user') {
    if (typeof window.MLNF.updateUserMenu === 'function') {
      window.MLNF.updateUserMenu();
    }
  }
}); 