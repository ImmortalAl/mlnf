// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
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

themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// Initialize theme on page load
initTheme();

// Listen for system theme changes
prefersDarkScheme.addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// Feedback System (integrated with messaging)
class FeedbackSystem {
    constructor() {
        this.modal = document.getElementById('feedbackModal');
        this.form = document.getElementById('feedbackForm');
        this.contentTextarea = document.getElementById('feedbackContent');
        this.anonymousCheckbox = document.getElementById('feedbackAnonymous');
        this.userInfoDisplay = document.getElementById('feedbackUserInfo');
        this.usernameSpan = document.getElementById('feedbackUsername');
        
        this.init();
    }
    
    init() {
        // Button event listeners
        const footerBtn = document.getElementById('feedbackBtnFooter');
        const closeBtn = document.getElementById('closeFeedbackModal');
        const cancelBtn = document.getElementById('cancelFeedback');
        
        if (footerBtn) footerBtn.addEventListener('click', () => this.openModal());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Anonymous checkbox toggle
        if (this.anonymousCheckbox) {
            this.anonymousCheckbox.addEventListener('change', () => this.toggleUserInfo());
        }
        
        // Modal click outside to close
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });
    }
    
    openModal() {
        if (!this.modal) return;
        
        // Reset form
        this.form.reset();
        this.clearMessages();
        
        // Auto-fill user info if logged in
        this.updateUserInfo();
        
        // Show modal
        this.modal.style.display = 'flex';
        this.modal.setAttribute('aria-hidden', 'false');
        
        // Focus on textarea
        setTimeout(() => {
            if (this.contentTextarea) this.contentTextarea.focus();
        }, 100);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        if (!this.modal) return;
        
        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
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
            // For visitors without accounts
            this.userInfoDisplay.style.display = 'none';
            this.anonymousCheckbox.checked = true;
            this.anonymousCheckbox.disabled = true;
            
            // Update the user info display to show visitor status
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
            this.showError('Please share your thoughts before sending!');
            return;
        }
        
        const isAnonymous = this.anonymousCheckbox.checked;
        const token = localStorage.getItem('sessionToken');
        
        // Prepare feedback data
        const feedbackData = {
            content: content,
            anonymous: isAnonymous
        };
        
        try {
            this.showLoading();
            
            // Send feedback to backend (as message to admin)
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
            
            const result = await response.json();
            console.log('Feedback sent successfully:', result);
            
            this.showSuccess(
                isAnonymous 
                    ? 'Your anonymous feedback has been sent to the admin! Thank you for sharing your thoughts.'
                    : 'Your feedback has been sent to the admin! They can reply to you directly through the messaging system.'
            );
            
            // Close modal after delay
            setTimeout(() => {
                this.closeModal();
            }, 3000);
            
        } catch (error) {
            console.error('Feedback submission error:', error);
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
}

// Initialize feedback system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize feedback system
    if (typeof window.feedbackSystem === 'undefined') {
        window.feedbackSystem = new FeedbackSystem();
    }
});