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
        const user = JSON.parse(localStorage.getItem('user') || '{}');
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
    }
    async handleSubmit(e) {
        e.preventDefault();
        const content = this.contentTextarea.value.trim();
        if (!content) {
            this.showError('Please share your immortal thoughts before sending!');
            return;
        }
        const isAnonymous = this.anonymousCheckbox.checked;
        const token = localStorage.getItem('sessionToken');
        const feedbackData = {
            content: content,
            anonymous: isAnonymous
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
            console.warn('[EternalSouls] Avatar System not available for founder display');
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
            console.error('[EternalSouls] Error populating founder card:', error);
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
            console.warn('[EternalSouls] Avatar System not available for featured soul display');
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
            console.error('[EternalSouls] Error populating featured soul:', error);
            featuredDisplay.innerHTML = `
                <div class="error-soul">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to summon featured soul</p>
                </div>
            `;
        }
    }
}

// Anonymous Messaging for Soul Highlights
function openFounderMessage() {
    openAnonymousMessage('ImmortalAl', 'Community Founder');
}

function openFeaturedSoulMessage() {
    if (!window.eternalSoulsHighlight?.featuredSoulData) {
        console.warn('[EternalSouls] No featured soul data available');
        return;
    }
    
    const featured = window.eternalSoulsHighlight.featuredSoulData;
    openAnonymousMessage(featured.username, 'Featured Soul');
}

function openAnonymousMessage(recipientUsername, recipientTitle) {
    // Check if we have the feedback modal system to extend
    if (!window.feedbackSystem) {
        console.warn('[EternalSouls] Feedback system not available, using fallback');
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

    // Show modal
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

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
        console.error('[EternalSouls] Error sending anonymous message:', error);
        alert(`Failed to send message: ${error.message}`);
        
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        }
    }
}

// Global functions for onclick handlers
window.openFounderMessage = openFounderMessage;
window.openFeaturedSoulMessage = openFeaturedSoulMessage;
window.closeAnonymousMessageModal = closeAnonymousMessageModal;