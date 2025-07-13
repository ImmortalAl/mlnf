// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon (only if themeToggle exists)
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Set theme based on system preference
        setTheme(prefersDarkScheme.matches ? 'dark' : 'light');
    }
}

// Only add event listener if themeToggle exists
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
}

// Initialize theme on page load
initTheme();

// Listen for system theme changes
prefersDarkScheme.addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// Immortal Feedback System
class FeedbackSystem {
    constructor() {
        this.modal = document.getElementById('feedbackModal');
        this.form = document.getElementById('feedbackForm');
        this.contentTextarea = document.getElementById('feedbackContent');
        this.anonymousCheckbox = document.getElementById('feedbackAnonymous');
        this.anonymousNameInput = document.getElementById('feedbackAnonymousName');
        this.anonymousNameGroup = document.getElementById('anonymousNameGroup');
        this.userInfoDisplay = document.getElementById('feedbackUserInfo');
        this.usernameSpan = document.getElementById('feedbackUsername');
        if (!this.modal || !this.form || !this.contentTextarea) return;
        this.init();
    }
    init() {
        const footerBtn = document.getElementById('feedbackBtnFooter');
        const closeBtn = document.getElementById('closeFeedbackModal');
        const cancelBtn = document.getElementById('cancelFeedback');
        if (footerBtn) footerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(() => this.openModal(), 10);
        });
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        if (this.anonymousCheckbox) {
            this.anonymousCheckbox.addEventListener('change', () => this.toggleUserInfo());
        }
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });
        
        // Add mobile keyboard detection for better modal positioning
        this.setupMobileKeyboardDetection();
    }
    openModal() {
        if (!this.modal) return;
        if (this.form) this.form.reset();
        this.clearMessages();
        this.updateUserInfo();
        this.modal.style.setProperty('display', 'flex', 'important');
        this.modal.style.opacity = '1';
        this.modal.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
            if (this.contentTextarea) this.contentTextarea.focus();
        }, 100);
        document.body.style.overflow = 'hidden';
    }
    closeModal() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');
        this.modal.classList.remove('keyboard-open');
        document.body.style.removeProperty('overflow');
    }
    updateUserInfo() {
        let user = {};
        try {
            user = JSON.parse(localStorage.getItem('user') || '{}');
        } catch (error) {
            // Error parsing user data from localStorage
            localStorage.removeItem('user'); // Clear corrupted data
        }
        const isLoggedIn = !!localStorage.getItem('sessionToken') && user.username;
        if (isLoggedIn) {
            this.usernameSpan.textContent = user.displayName || user.username;
            this.userInfoDisplay.style.display = 'block';
            this.anonymousCheckbox.checked = false;
            this.anonymousCheckbox.disabled = false;
        } else {
            this.userInfoDisplay.style.display = 'none';
            this.anonymousCheckbox.checked = true;
            this.anonymousCheckbox.disabled = true;
            this.usernameSpan.textContent = 'Visitor (not logged in)';
        }
        this.toggleUserInfo();
    }
    toggleUserInfo() {
        const isAnonymous = this.anonymousCheckbox.checked;
        this.userInfoDisplay.style.display = isAnonymous ? 'none' : 'block';
        
        // Show/hide anonymous name field when anonymous is checked
        if (this.anonymousNameGroup) {
            this.anonymousNameGroup.style.display = isAnonymous ? 'block' : 'none';
        }
    }
    async handleSubmit(e) {
        e.preventDefault();
        const content = this.contentTextarea.value.trim();
        if (!content) {
            this.showError('Please share your immortal thoughts before sending!');
            return;
        }
        const isAnonymous = this.anonymousCheckbox.checked;
        const anonymousName = this.anonymousNameInput ? this.anonymousNameInput.value.trim() : '';
        const token = localStorage.getItem('sessionToken');
        const feedbackData = {
            content: content,
            anonymous: isAnonymous,
            ...(isAnonymous && anonymousName && { anonymousName: anonymousName })
        };
        try {
            this.showLoading();
            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && !isAnonymous && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(feedbackData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to send feedback: ${response.status}`);
            }
            this.showSuccess(
                isAnonymous 
                    ? 'Your anonymous feedback has been sent to the Eternal Dominion! Thank you for sharing your soul.'
                    : 'Your feedback has been sent to the Eternal Dominion! The admin may reply to you through the immortal messaging system.'
            );
            setTimeout(() => {
                this.closeModal();
            }, 3000);
        } catch (error) {
            this.showError(error.message || 'Failed to send feedback. Please try again or contact us directly.');
        }
    }
    showLoading() {
        const submitBtn = document.getElementById('submitFeedback');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
    }
    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'feedback-success';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        this.form.insertBefore(successDiv, this.form.firstChild);
        this.resetSubmitButton();
    }
    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'feedback-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        this.form.insertBefore(errorDiv, this.form.firstChild);
        this.resetSubmitButton();
    }
    clearMessages() {
        const existing = this.form.querySelectorAll('.feedback-success, .feedback-error');
        existing.forEach(el => el.remove());
    }
    resetSubmitButton() {
        const submitBtn = document.getElementById('submitFeedback');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Feedback';
        }
    }
    
    setupMobileKeyboardDetection() {
        // Only add keyboard detection on mobile devices (screen width <= 480px)
        if (window.innerWidth > 480) return;
        
        // Store initial viewport height when modal opens
        let initialHeight = window.innerHeight;
        
        // Add focus and blur listeners to form inputs
        const inputs = this.modal.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('focusin', () => {
                // Store height when input is focused
                initialHeight = window.innerHeight;
                
                // Use Visual Viewport API if available (more reliable)
                if (window.visualViewport) {
                    const handleViewportChange = () => {
                        const heightDiff = initialHeight - window.visualViewport.height;
                        if (heightDiff > 150 && this.modal && this.modal.style.display === 'flex') {
                            this.modal.classList.add('keyboard-open');
                        }
                    };
                    window.visualViewport.addEventListener('resize', handleViewportChange);
                } else {
                    // Fallback: Use timeout for devices without Visual Viewport API
                    setTimeout(() => {
                        if (this.modal && this.modal.style.display === 'flex') {
                            this.modal.classList.add('keyboard-open');
                        }
                    }, 300);
                }
            });
            
            input.addEventListener('focusout', () => {
                // Small delay to ensure keyboard is closing
                setTimeout(() => {
                    if (this.modal) {
                        this.modal.classList.remove('keyboard-open');
                    }
                }, 300);
            });
        });
        
        // Enhanced viewport detection
        const handleResize = () => {
            if (!this.modal || this.modal.style.display !== 'flex') return;
            
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const heightDifference = initialHeight - currentHeight;
            
            // More accurate keyboard detection
            if (heightDifference > 150) {
                this.modal.classList.add('keyboard-open');
            } else if (heightDifference < 50) {
                this.modal.classList.remove('keyboard-open');
            }
        };
        
        // Use Visual Viewport API if available, otherwise fallback to window resize
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
        }
    }
}
window.addEventListener('load', () => {
    if (typeof window.feedbackSystem === 'undefined') {
        window.feedbackSystem = new FeedbackSystem();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.feedbackSystem === 'undefined') {
            window.feedbackSystem = new FeedbackSystem();
        }
    }, 500);
    
    // Initialize Eternal Souls Highlight system
    setTimeout(() => {
        if (window.MLNFAvatars) {
            window.eternalSoulsHighlight = new EternalSoulsHighlight();
        } else {
            // Wait for Avatar System to load
            const checkAvatarSystem = setInterval(() => {
                if (window.MLNFAvatars) {
                    clearInterval(checkAvatarSystem);
                    window.eternalSoulsHighlight = new EternalSoulsHighlight();
                }
            }, 500);
        }
    }, 1000);
});

// Eternal Souls Highlight System
class EternalSoulsHighlight {
    constructor() {
        this.featuredSoulData = null;
        this.init();
    }

    async init() {
        await this.populateFounderCard();
        await this.populateFeaturedSoul();
    }

    async populateFounderCard() {
        const founderDisplay = document.getElementById('founder-soul-display');
        if (!founderDisplay) {
            // This is expected on pages without the founder display element
            return;
        }
        if (!window.MLNFAvatars) {
            // Avatar System not available for founder display
            return;
        }

        try {
            // Fetch ImmortalAl's profile data
            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users/ImmortalAl`);
            let founderData = {
                username: 'ImmortalAl',
                displayName: 'ImmortalAl',
                title: 'Community Founder',
                status: 'Manifesting Liberation, Naturally Free',
                online: true,
                avatar: null,
                isVIP: true,
                role: 'admin'
            };

            if (response.ok) {
                const profileData = await response.json();
                founderData = {
                    ...founderData,
                    displayName: profileData.displayName || 'ImmortalAl',
                    status: profileData.status || 'Manifesting Liberation, Naturally Free',
                    online: profileData.online !== undefined ? profileData.online : true,
                    avatar: profileData.avatar
                };
            }

            // Create founder display using MLNF Avatar System
            const founderUserDisplay = window.MLNFAvatars.createUserDisplay({
                username: founderData.username,
                title: founderData.title,
                status: founderData.status,
                avatarSize: 'xl',
                displaySize: 'lg',
                mystical: true,
                online: founderData.online,
                customAvatar: founderData.avatar,
                usernameStyle: 'mystical',
                clickable: false // Disable click since we have dedicated buttons
            });

            founderDisplay.innerHTML = '';
            founderDisplay.appendChild(founderUserDisplay);


        } catch (error) {
            // Error populating founder card
            founderDisplay.innerHTML = `
                <div class="error-soul">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to summon founder data</p>
                </div>
            `;
        }
    }

    async populateFeaturedSoul() {
        const featuredDisplay = document.getElementById('featured-soul-display');
        const featuredActions = document.getElementById('featured-soul-actions');
        const featuredProfileLink = document.getElementById('featured-soul-profile-link');

        if (!featuredDisplay) {
            // This is expected on pages without the featured soul display element
            return;
        }
        if (!window.MLNFAvatars) {
            // Avatar System not available for featured soul display
            return;
        }

        try {
            // Fetch users and select first one (or based on criteria)
            const token = localStorage.getItem('sessionToken');
            const headers = token ? 
                { 'Authorization': `Bearer ${token}` } : 
                {};

            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/users?limit=5`, {
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }

            const responseData = await response.json();
            let users = [];

            // Handle different response structures
            if (Array.isArray(responseData)) {
                users = responseData;
            } else if (responseData.users && Array.isArray(responseData.users)) {
                users = responseData.users;
            } else if (responseData.data && Array.isArray(responseData.data)) {
                users = responseData.data;
            }

            // Filter out ImmortalAl and select first available user
            const availableUsers = users.filter(user => 
                user.username && user.username.toLowerCase() !== 'immortalal'
            );

            if (availableUsers.length === 0) {
                throw new Error('No featured souls available');
            }

            // Select first user as featured soul
            this.featuredSoulData = availableUsers[0];
            const featuredSoul = this.featuredSoulData;

            // Create featured soul display
            const featuredUserDisplay = window.MLNFAvatars.createUserDisplay({
                username: featuredSoul.username,
                title: 'Featured Community Soul',
                status: featuredSoul.status || 'Wandering the eternal realms...',
                avatarSize: 'xl',
                displaySize: 'lg',
                mystical: featuredSoul.isVIP || featuredSoul.role === 'admin',
                online: featuredSoul.online,
                customAvatar: featuredSoul.avatar,
                usernameStyle: 'immortal',
                clickable: false // Disable click since we have dedicated buttons
            });

            // Update display
            featuredDisplay.innerHTML = '';
            featuredDisplay.appendChild(featuredUserDisplay);

            // Update profile link
            if (featuredProfileLink) {
                featuredProfileLink.href = `/souls/${featuredSoul.username}.html`;
                featuredProfileLink.setAttribute('aria-label', `View ${featuredSoul.username}'s profile`);
            }

            // Show actions
            if (featuredActions) {
                featuredActions.style.display = 'flex';
            }


        } catch (error) {
            // Error populating featured soul
            featuredDisplay.innerHTML = `
                <div class="error-soul">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to summon featured soul</p>
                </div>
            `;
        }
    }
}

// Authenticated Messaging for Soul Highlights  
function openFounderMessage() {
    // Check if user is authenticated
    if (window.MLNF?.authManager?.isAuthenticated?.() || localStorage.getItem('sessionToken')) {
        if (window.MLNF?.openMessageModal) {
            window.MLNF.openMessageModal('ImmortalAl');
        } else {
            // Message modal not available
        }
    } else {
        // Show authentication required message
        showAuthenticationRequired('message the MLNF Founder');
    }
}

function openFeaturedSoulMessage() {
    if (!window.eternalSoulsHighlight?.featuredSoulData) {
        // No featured soul data available
        return;
    }
    
    const featured = window.eternalSoulsHighlight.featuredSoulData;
    
    // Check if user is authenticated
    if (window.MLNF?.authManager?.isAuthenticated?.() || localStorage.getItem('sessionToken')) {
        if (window.MLNF?.openMessageModal) {
            window.MLNF.openMessageModal(featured.username);
        } else {
            // Message modal not available
        }
    } else {
        // Show authentication required message  
        showAuthenticationRequired(`message ${featured.username}`);
    }
}

// Show authentication required notification
function showAuthenticationRequired(action) {
    const notification = document.createElement('div');
    notification.className = 'auth-required-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-lock"></i>
            <h4>Authentication Required</h4>
            <p>You must be logged in to ${action}. Authentic soul-to-soul connections require verified identity.</p>
            <div class="notification-actions">
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove(); window.MLNF?.authManager?.openAuthModal?.()">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
                <button class="btn btn-outline" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles if not already present
    if (!document.getElementById('auth-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'auth-notification-styles';
        styles.textContent = `
            .auth-required-notification {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                backdrop-filter: blur(5px);
            }
            .auth-required-notification .notification-content {
                background: linear-gradient(135deg, rgba(26, 26, 51, 0.95), rgba(13, 13, 26, 0.85));
                border: 2px solid rgba(255, 94, 120, 0.3);
                border-radius: 12px;
                padding: 2rem;
                max-width: 400px;
                text-align: center;
                color: var(--text);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .auth-required-notification h4 {
                color: var(--accent);
                margin: 1rem 0;
                font-size: 1.3rem;
            }
            .auth-required-notification p {
                margin: 1rem 0 1.5rem 0;
                line-height: 1.5;
                color: var(--text-secondary);
            }
            .auth-required-notification .notification-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            .auth-required-notification .fas {
                font-size: 2rem;
                color: var(--accent);
                margin-bottom: 1rem;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// DEPRECATED: Anonymous messaging for Eternal Souls Highlights removed
// These functions are kept only for the feedback modal system
function openAnonymousMessage(recipientUsername, recipientTitle) {
    // Check if we have the feedback modal system to extend
    if (!window.feedbackSystem) {
        // Feedback system not available, using fallback
        // Fallback to simple prompt
        const message = prompt(`Send an anonymous message to ${recipientUsername}:`);
        if (message && message.trim()) {
            sendAnonymousMessage(recipientUsername, message.trim());
        }
        return;
    }

    // Create enhanced anonymous message modal
    createAnonymousMessageModal(recipientUsername, recipientTitle);
}

function createAnonymousMessageModal(recipientUsername, recipientTitle) {
    // Remove existing modal if present
    const existingModal = document.getElementById('anonymousMessageModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create new modal
    const modal = document.createElement('div');
    modal.id = 'anonymousMessageModal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <form id="anonymousMessageForm" class="feedback-modal anonymous-message-modal">
            <button type="button" class="close-modal" onclick="closeAnonymousMessageModal()">
                <i class="fas fa-times"></i>
            </button>
            
            <h3>
                <i class="fas fa-mask"></i> Anonymous Message
            </h3>
            
            <div class="recipient-info">
                <p>Sending to: <strong>${recipientUsername}</strong> (${recipientTitle})</p>
            </div>
            
            <div class="form-group">
                <label for="senderName">Your Name (Optional):</label>
                <input type="text" id="senderName" placeholder="Anonymous Soul" maxlength="50">
                <small>Leave blank to remain completely anonymous</small>
            </div>
            
            <div class="form-group">
                <textarea id="anonymousMessageContent" 
                         placeholder="Share your thoughts with this eternal soul..." 
                         maxlength="1000" required></textarea>
            </div>
            
            <div class="modal-actions">
                <button type="submit" id="sendAnonymousMessage" class="btn btn-primary">
                    <i class="fas fa-paper-plane"></i> Send Message
                </button>
                <button type="button" onclick="closeAnonymousMessageModal()" class="btn btn-outline">
                    Cancel
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(modal);

    // Close active users sidebar if open (prevents z-index conflicts on mobile)
    const activeUsersSidebar = document.getElementById('activeUsers');
    const activeUsersOverlay = document.getElementById('activeUsersOverlay');
    if (activeUsersSidebar && activeUsersSidebar.classList.contains('active')) {
        activeUsersSidebar.classList.remove('active');
        if (activeUsersOverlay) activeUsersOverlay.classList.remove('active');
    }
    
    // Show modal
    modal.style.display = 'flex';
    modal.style.zIndex = '999999'; // Force highest z-index to override sidebar
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Setup mobile keyboard detection for professional UX
    setupMobileKeyboardDetectionFrontPage(modal);

    // Focus on textarea
    setTimeout(() => {
        document.getElementById('anonymousMessageContent').focus();
    }, 100);

    // Handle form submission
    document.getElementById('anonymousMessageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const senderName = document.getElementById('senderName').value.trim() || 'Anonymous Soul';
        const content = document.getElementById('anonymousMessageContent').value.trim();
        
        if (!content) {
            alert('Please enter a message');
            return;
        }

        await sendAnonymousMessage(recipientUsername, content, senderName);
    });

    // Handle backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAnonymousMessageModal();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') {
            closeAnonymousMessageModal();
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

function closeAnonymousMessageModal() {
    const modal = document.getElementById('anonymousMessageModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.removeProperty('overflow');
        
        // Cleanup mobile keyboard detection
        if (modal.keyboardCleanup) {
            modal.keyboardCleanup();
        }
        
        modal.remove();
    }
}

async function sendAnonymousMessage(recipientUsername, content, senderName = 'Anonymous Soul') {
    const submitBtn = document.getElementById('sendAnonymousMessage');
    
    try {
        // Show loading
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        // For now, use the existing feedback endpoint
        // Later this can be enhanced with a dedicated anonymous message endpoint
        const messageData = {
            content: `[Anonymous Message to ${recipientUsername}]\nFrom: ${senderName}\n\n${content}`,
            anonymous: true,
            recipient: recipientUsername
        };

        const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/messages/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status}`);
        }

        // Show success
        alert(`Your anonymous message has been sent to ${recipientUsername}!`);
        closeAnonymousMessageModal();


    } catch (error) {
        // Error sending anonymous message
        alert(`Failed to send message: ${error.message}`);
        
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        }
    }
}

// Mobile keyboard detection for front page anonymous modals
function setupMobileKeyboardDetectionFrontPage(modal) {
    if (!modal) return;
    
    // Only apply on mobile devices
    if (window.innerWidth > 768) return;
    
    let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let keyboardDetectionTimeout = null;
    
    function handleViewportChange() {
        if (keyboardDetectionTimeout) {
            clearTimeout(keyboardDetectionTimeout);
        }
        
        keyboardDetectionTimeout = setTimeout(() => {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            // Keyboard is considered open if viewport height decreased by more than 150px
            const keyboardOpen = heightDifference > 150;
            
            if (keyboardOpen) {
                modal.classList.add('keyboard-detected');
            } else {
                modal.classList.remove('keyboard-detected');
            }
        }, 100); // Small delay to allow for viewport stabilization
    }
    
    function handleResize() {
        // Update initial height when device orientation changes
        const newHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        if (Math.abs(newHeight - initialViewportHeight) > 200) {
            initialViewportHeight = newHeight;
            modal.classList.remove('keyboard-detected');
        }
    }
    
    // Use Visual Viewport API if available (modern browsers)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.addEventListener('orientationchange', handleResize);
    } else {
        // Fallback for older browsers
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('orientationchange', handleResize);
    }
    
    // Focus and blur events for additional keyboard detection
    const inputElements = modal.querySelectorAll('input, textarea');
    inputElements.forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(handleViewportChange, 300); // Delay for keyboard animation
        });
        
        input.addEventListener('blur', () => {
            setTimeout(handleViewportChange, 300); // Delay for keyboard animation
        });
    });
    
    // Cleanup function to remove event listeners when modal closes
    modal.keyboardCleanup = function() {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('orientationchange', handleResize);
        } else {
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('orientationchange', handleResize);
        }
        
        inputElements.forEach(input => {
            input.removeEventListener('focus', handleViewportChange);
            input.removeEventListener('blur', handleViewportChange);
        });
        
        if (keyboardDetectionTimeout) {
            clearTimeout(keyboardDetectionTimeout);
        }
        
        modal.classList.remove('keyboard-detected');
    };
}

// Global functions for onclick handlers
window.openFounderMessage = openFounderMessage;
window.openFeaturedSoulMessage = openFeaturedSoulMessage;
window.closeAnonymousMessageModal = closeAnonymousMessageModal;

