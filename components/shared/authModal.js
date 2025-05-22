// authModal.js - Handles the Soul Modal for authentication

// Constants
const API_BASE_URL = 'https://mlnf-auth.onrender.com/api';

// Create and inject the Soul Modal
function injectSoulModal() {
  // Create modal HTML
  const modalHTML = `
    <div id="soulModal" class="soul-modal" aria-modal="true" role="dialog" tabindex="-1">
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
    </div>
  `;
  
  // Create a container for the modal
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  
  // Append to body
  document.body.appendChild(modalContainer);
  
  // Get modal elements
  soulModal = document.getElementById('soulModal');
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
  if (!soulModal) {
    console.error('[Auth Modal] openSoulModal: soulModal element not found!');
    return;
  }
  
  setSoulModalView(mode);
  soulModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scroll
  
  const usernameInput = soulModal.querySelector('input[name="username"]');
  if (usernameInput) usernameInput.focus();
}

// Close the Soul Modal
function closeSoulModal() {
  if (!soulModal) {
    console.error('[Auth Modal] closeSoulModal: soulModal element not found!');
    return;
  }
  
  soulModal.classList.remove('active');
  document.body.style.overflow = ''; // Restore background scroll
  
  if (modalFeedback) modalFeedback.textContent = '';
  if (soulLoginForm) soulLoginForm.reset();
}

// Handle form submission for login/register
async function handleSoulModalSubmit(event) {
  event.preventDefault();
  
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
    
    url = `${API_BASE_URL}/auth/register`;
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
    
    const data = await response.json();
    
    if (!response.ok) {
      modalFeedback.textContent = data.message || `Error: ${response.status}`;
      modalFeedback.classList.add('error');
      throw new Error(data.message || `HTTP error ${response.status}`);
    }
    
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
        
        // Update UI components
        if (window.MLNF && window.MLNF.updateUserMenu) {
          window.MLNF.updateUserMenu();
        }
        
        if (window.MLNF && window.MLNF.updateUserSidebar) {
          window.MLNF.updateUserSidebar();
        }
        
        // Close modal and reload page
        setTimeout(() => {
          closeSoulModal();
          window.location.reload();
        }, 1500);
      } else {
        modalFeedback.textContent = data.message || 'Token not received. Entry denied.';
        modalFeedback.classList.add('error');
      }
    } else { // Register
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
  } catch (error) {
    console.error(`[Auth Modal Error - ${mode}]:`, error);
    
    if (!modalFeedback.textContent || modalFeedback.textContent === 'Processing...') {
      modalFeedback.textContent = 'An unexpected disturbance occurred.';
    }
    
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
  injectSoulModal();
  setupSoulModalEvents();
}

// Export functions
window.MLNF = window.MLNF || {};
window.MLNF.initAuthModal = initAuthModal;
window.MLNF.openSoulModal = openSoulModal;
window.MLNF.closeSoulModal = closeSoulModal; 