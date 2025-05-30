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
            const response = await fetch('/messages/feedback', {
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
});