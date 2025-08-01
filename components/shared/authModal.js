// authModal.js - Handles the Soul Modal for authentication

// Constants are now in config.js and accessed via window.MLNF_CONFIG
// const API_BASE_URL = 'https://mlnf-auth.onrender.com/api'; // REMOVED

// Create and inject the Soul Modal
function injectSoulModal() {
  console.log('[Auth Modal] Injecting Soul Modal into DOM...');
  // Create modal element directly
  const modalDiv = document.createElement('div');
  modalDiv.id = 'soulModal';
  modalDiv.className = 'soul-modal';
  modalDiv.setAttribute('aria-modal', 'true');
  modalDiv.setAttribute('role', 'dialog');
  modalDiv.setAttribute('tabindex', '-1');
  modalDiv.style.cssText = 'z-index: 99999 !important;'; // Ensure highest z-index
  
  modalDiv.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" aria-label="Close">&times;</button>
      <h2 id="soulModalTitle">Enter the Sanctuary</h2>
      <form id="soulLoginForm" autocomplete="on">
        <label>
          <span>Soul Identifier (Username)</span>
          <input type="text" name="username" required autocomplete="username" />
        </label>
        <label>
          <span>Ethereal Key (Password)</span>
          <input type="password" name="password" required autocomplete="current-password" />
        </label>
        <label id="confirmPasswordField" style="display: none;">
          <span>Confirm Ethereal Key</span>
          <input type="password" name="confirmPassword" autocomplete="new-password" />
        </label>
        <button type="submit" class="modal-btn" id="soulModalSubmit">Transcend</button>
      </form>
      <div class="modal-feedback" id="modalFeedback"></div>
      <p class="modal-toggle-view" id="modalToggleView">
        New to the Sanctuary? <a href="#" id="switchToRegisterLink">Claim Your Immortality</a>
      </p>
    </div>
  `;
  
  // Append directly to body
  document.body.appendChild(modalDiv);
  console.log('[Auth Modal] Modal element appended to body');
  
  // Get modal elements
  soulModal = document.getElementById('soulModal');
  console.log('[Auth Modal] Soul modal element found:', soulModal ? 'YES' : 'NO');
  soulModalTitle = document.getElementById('soulModalTitle');
  soulLoginForm = document.getElementById('soulLoginForm');
  soulModalSubmit = document.getElementById('soulModalSubmit');
  modalFeedback = document.getElementById('modalFeedback');
  confirmPasswordField = document.getElementById('confirmPasswordField');
  modalToggleView = document.getElementById('modalToggleView');
}

// Modal elements references
let soulModal, soulModalTitle, soulLoginForm, soulModalSubmit, modalFeedback, confirmPasswordField, modalToggleView;

// Link texts
const switchToRegisterLinkHTML = 'New to the Sanctuary? <a href="#" id="switchToRegisterLink">Claim Your Immortality</a>';
const switchToLoginLinkHTML = 'Already an Immortal? <a href="#" id="switchToLoginLink">Enter Now</a>';

// Set modal view (login or register)
function setSoulModalView(mode) {
  if (!soulModal || !soulLoginForm || !soulModalTitle || !confirmPasswordField || !soulModalSubmit || !modalToggleView) {
    console.error('[Auth Modal] setSoulModalView: Crucial modal elements missing.');
    return;
  }
  
  soulLoginForm.reset();
  if (modalFeedback) modalFeedback.textContent = '';
  soulModal.dataset.mode = mode;
  
  if (mode === 'register') {
    soulModalTitle.textContent = 'Claim Your Immortality';
    confirmPasswordField.style.display = 'block';
    soulModalSubmit.textContent = 'Begin Your Eternity';
    modalToggleView.innerHTML = switchToLoginLinkHTML;
    // Ensure confirm password input is required for registration
    const confirmPasswordInput = confirmPasswordField.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput) confirmPasswordInput.required = true;
  } else { // Default to login
    soulModalTitle.textContent = 'Enter the Sanctuary';
    confirmPasswordField.style.display = 'none';
    soulModalSubmit.textContent = 'Transcend';
    modalToggleView.innerHTML = switchToRegisterLinkHTML;
    // Ensure confirm password input is NOT required for login
    const confirmPasswordInput = confirmPasswordField.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput) confirmPasswordInput.required = false;
  }
}

// Open the Soul Modal
function openSoulModal(mode = 'login') {
  console.log('[Auth Modal] openSoulModal called with mode:', mode);
  if (!soulModal) {
    console.error('[Auth Modal] openSoulModal: soulModal element not found!');
    return;
  }
  
  setSoulModalView(mode);
  soulModal.classList.add('active');
  soulModal.style.display = 'flex'; // Ensure modal is displayed
  soulModal.style.zIndex = '99999'; // Force highest z-index
  soulModal.style.opacity = '1'; // Force opacity
  soulModal.style.visibility = 'visible'; // Force visibility
  console.log('[Auth Modal] Modal styles set - opacity:', soulModal.style.opacity, 'visibility:', soulModal.style.visibility, 'z-index:', soulModal.style.zIndex);
  document.body.style.overflow = 'hidden'; // Prevent background scroll
  
  const usernameInput = soulModal.querySelector('input[name="username"]');
  if (usernameInput) {
    setTimeout(() => usernameInput.focus(), 100); // Delay focus for animation
  }
}

// Close the Soul Modal
function closeSoulModal() {
  if (!soulModal) {
    console.error('[Auth Modal] closeSoulModal: soulModal element not found!');
    return;
  }
  
  soulModal.classList.remove('active');
  setTimeout(() => {
    soulModal.style.display = 'none'; // Hide after animation
  }, 300);
  document.body.style.removeProperty('overflow'); // Restore background scroll
  
  if (modalFeedback) modalFeedback.textContent = '';
  if (soulLoginForm) soulLoginForm.reset();
}

// Handle form submission for login/register
async function handleSoulModalSubmit(event) {
  event.preventDefault();
  const API_BASE_URL = window.MLNF_CONFIG.API_BASE_URL; // Use from config
  
  if (!soulLoginForm || !modalFeedback || !soulModalSubmit || !soulModal) return;
  
  modalFeedback.textContent = '';
  modalFeedback.className = 'modal-feedback'; // Reset class
  
  const username = soulLoginForm.username.value.trim();
  const password = soulLoginForm.password.value;
  const mode = soulModal.dataset.mode || 'login';
  
  if (!username || !password) {
    modalFeedback.textContent = 'Soul Identifier and Ethereal Key are required.';
    modalFeedback.classList.add('error');
    return;
  }
  
  let url = '';
  let payload = { username, password };
  
  if (mode === 'register') {
    const confirmPasswordInput = soulLoginForm.confirmPassword;
    if (!confirmPasswordInput) {
      modalFeedback.textContent = 'Confirm password field missing.';
      modalFeedback.classList.add('error');
      return;
    }
    
    const confirmPassword = confirmPasswordInput.value;
    if (password !== confirmPassword) {
      modalFeedback.textContent = 'Ethereal Keys do not align.';
      modalFeedback.classList.add('error');
      return;
    }
    
    url = `${API_BASE_URL}/auth/signup`;
  } else {
    url = `${API_BASE_URL}/auth/login`;
  }
  
  soulModalSubmit.disabled = true;
  soulModalSubmit.textContent = mode === 'register' ? 'Forging...' : 'Transcending...';
  modalFeedback.textContent = 'Processing...';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      let errorMessage = `Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (jsonError) {
        // If JSON parsing fails, use the status-based message
      }
      modalFeedback.textContent = errorMessage;
      modalFeedback.classList.add('error');
      return; // Exit early for HTTP errors
    }
    
    const data = await response.json();
    
    if (mode === 'login') {
      if (data.token) {
        localStorage.setItem('sessionToken', data.token);
        
        // Fetch user data after login
        const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Handle failure to fetch user data
          localStorage.removeItem('user');
        }
        
        modalFeedback.textContent = 'Sanctuary access granted.';
        modalFeedback.classList.add('success');
        
        // After successful login or registration, optionally update user display
        if (window.MLNF && window.MLNF.updateUserMenu) {
          window.MLNF.updateUserMenu();
        }
        
        // Close the modal
        setTimeout(() => {
          closeSoulModal();
          window.location.reload();
        }, 1500);
      } else {
        modalFeedback.textContent = data.message || 'Token not received. Entry denied.';
        modalFeedback.classList.add('error');
      }
    } else { // Register
      // Registration successful - handle like login since backend returns token and user
      if (data.token) {
        localStorage.setItem('sessionToken', data.token);
        
        // Store user data if provided
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        modalFeedback.textContent = 'Eternity claimed! Welcome to the Sanctuary.';
        modalFeedback.classList.add('success');
        
        // Update user display
        if (window.MLNF && window.MLNF.updateUserMenu) {
          window.MLNF.updateUserMenu();
        }
        
        // Close the modal and refresh page
        setTimeout(() => {
          closeSoulModal();
          window.location.reload();
        }, 1500);
      } else {
        // Fallback if no token (shouldn't happen with current backend)
        modalFeedback.textContent = data.message || 'Eternity claimed! Please enter the Sanctuary now.';
        modalFeedback.classList.add('success');
        
        setTimeout(() => {
          setSoulModalView('login');
          soulModalSubmit.disabled = false;
          soulModalSubmit.textContent = 'Transcend';
          modalFeedback.textContent = 'Please login with your new credentials.';
          modalFeedback.className = 'modal-feedback';
        }, 2000);
        
        return; // Skip re-enabling button below
      }
    }
  } catch (error) {
    console.error(`[Auth Modal Error - ${mode}]:`, error);
    
    // Handle different types of network errors
    let errorMessage = 'An unexpected disturbance occurred.';
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network connection failed. Please check your internet connection.';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'Cross-origin request blocked. Please try again.';
    } else if (error.message.includes('NetworkError')) {
      errorMessage = 'Network error occurred. Please try again.';
    }
    
    modalFeedback.textContent = errorMessage;
    modalFeedback.classList.add('error');
  } finally {
    if (mode !== 'register' || !modalFeedback.classList.contains('success')) {
      soulModalSubmit.disabled = false;
      soulModalSubmit.textContent = mode === 'register' ? 'Begin Your Eternity' : 'Transcend';
    }
  }
}

// Setup modal event listeners
function setupSoulModalEvents() {
  // Get modal elements if not already assigned
  if (!soulModal) soulModal = document.getElementById('soulModal');
  if (!soulModalTitle) soulModalTitle = document.getElementById('soulModalTitle');
  if (!soulLoginForm) soulLoginForm = document.getElementById('soulLoginForm');
  if (!soulModalSubmit) soulModalSubmit = document.getElementById('soulModalSubmit');
  if (!modalFeedback) modalFeedback = document.getElementById('modalFeedback');
  if (!confirmPasswordField) confirmPasswordField = document.getElementById('confirmPasswordField');
  if (!modalToggleView) modalToggleView = document.getElementById('modalToggleView');
  
  if (!soulModal || !soulLoginForm) {
    console.error('[Auth Modal] Setup failed: Required elements not found');
    return;
  }
  
  // Close button event
  const closeButton = soulModal.querySelector('.close-modal');
  if (closeButton) {
    closeButton.addEventListener('click', closeSoulModal);
  }
  
  // Close on click outside
  soulModal.addEventListener('click', (event) => {
    if (event.target === soulModal) {
      closeSoulModal();
    }
  });
  
  // Toggle between login/register
  modalToggleView.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      event.preventDefault();
      
      if (event.target.id === 'switchToRegisterLink') {
        setSoulModalView('register');
      } else if (event.target.id === 'switchToLoginLink') {
        setSoulModalView('login');
      }
    }
  });
  
  // Form submission
  soulLoginForm.addEventListener('submit', handleSoulModalSubmit);
}

// Initialize auth modal
function initAuthModal() {
  console.log('[Auth Modal] Initializing auth modal...');
  injectSoulModal();
  setupSoulModalEvents();
  console.log('[Auth Modal] Auth modal initialization complete');
}

// Export functions
window.MLNF = window.MLNF || {};
window.MLNF.initAuthModal = initAuthModal;
window.MLNF.openSoulModal = openSoulModal;
window.MLNF.closeSoulModal = closeSoulModal;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthModal);
} else {
  // DOM is already loaded
  initAuthModal();
} 