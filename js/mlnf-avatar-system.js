/**
 * MLNF Avatar System - Site-wide avatar and user display utilities
 * Version: 2.0 - Enhanced with Unified Profile Navigation
 * 
 * This utility provides consistent avatar and user display functionality
 * across the entire MLNF site with immortal-themed styling and
 * unified profile navigation system.
 */

/**
 * Profile Router - Handles smooth navigation to user profiles
 */
class MLNFProfileRouter {
    static navigateToProfile(username, options = {}) {
        const { newTab = false, trackInteraction = true } = options;
        
        // Use Netlify redirect system: /souls/username -> /souls/[username].html
        const profileUrl = `/souls/${encodeURIComponent(username)}`;
        
        if (newTab) {
            window.open(profileUrl, '_blank');
        } else {
            window.location.href = profileUrl;
        }
    }
    
    static createUnifiedClickHandler(username, options = {}) {
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Handle keyboard shortcuts
            if (event.shiftKey) {
                // Shift+Click: Open profile preview modal
                MLNFProfilePreview.showPreview(username);
            } else if (event.ctrlKey || event.metaKey) {
                // Ctrl+Click: Open in new tab
                this.navigateToProfile(username, { newTab: true });
            } else {
                // Regular click: Navigate to profile
                this.navigateToProfile(username);
            }
        };
    }
}

/**
 * Profile Preview Modal - Quick profile previews with immortal theming
 */
class MLNFProfilePreview {
    static currentModal = null;
    
    static async showPreview(username) {
        try {
            // Close existing modal if open
            this.closePreview();
            
            // Create modal element
            const modal = this.createModalElement(username);
            document.body.appendChild(modal);
            this.currentModal = modal;
            
            // Load user data
            const userData = await this.fetchUserData(username);
            this.populateModal(modal, userData);
            
            // Show modal with animation
            requestAnimationFrame(() => {
                modal.classList.add('mlnf-profile-preview--visible');
            });
            
            // Add event listeners
            this.addModalEventListeners(modal);
            
        } catch (error) {
            console.error('[MLNF] Profile preview error:', error);
            this.showError('Unable to load profile preview');
        }
    }
    
    static createModalElement(username) {
        const modal = document.createElement('div');
        modal.className = 'mlnf-profile-preview';
        modal.innerHTML = `
            <div class="mlnf-profile-preview__backdrop"></div>
            <div class="mlnf-profile-preview__content">
                <div class="mlnf-profile-preview__header">
                    <div class="mlnf-profile-preview__loading">
                        <div class="mlnf-loading-spinner"></div>
                        <span class="font-immortal-heading">Loading ${username}'s profile...</span>
                    </div>
                    <button class="mlnf-profile-preview__close" aria-label="Close profile preview">
                        <span>×</span>
                    </button>
                </div>
                <div class="mlnf-profile-preview__body"></div>
                <div class="mlnf-profile-preview__actions"></div>
            </div>
        `;
        return modal;
    }
    
    static async fetchUserData(username) {
        // Use existing API pattern from the site
        const response = await fetch(`https://mlnf-auth.onrender.com/api/users/${username}`);
        if (!response.ok) {
            throw new Error(`Profile not found: ${response.status}`);
        }
        return await response.json();
    }
    
    static populateModal(modal, userData) {
        const body = modal.querySelector('.mlnf-profile-preview__body');
        const actions = modal.querySelector('.mlnf-profile-preview__actions');
        const loading = modal.querySelector('.mlnf-profile-preview__loading');
        
        // Hide loading spinner
        loading.style.display = 'none';
        
        // Create user display with enhanced styling
        const userDisplay = window.MLNFAvatars.createUserDisplay({
            username: userData.username,
            title: userData.title || 'Eternal Soul',
            status: userData.status || (userData.online ? 'Online now' : 'Eternal wanderer'),
            avatarSize: 'xl',
            displaySize: 'xl',
            mystical: userData.isVIP || userData.role === 'admin',
            online: userData.online,
            customAvatar: userData.avatar,
            usernameStyle: 'mystical'
        });
        
        body.appendChild(userDisplay);
        
        // Add bio if available
        if (userData.bio) {
            const bioEl = document.createElement('div');
            bioEl.className = 'mlnf-profile-preview__bio';
            bioEl.innerHTML = `
                <h4 class="font-immortal-heading">About ${userData.username}</h4>
                <p>${userData.bio}</p>
            `;
            body.appendChild(bioEl);
        }
        
        // Add stats if available
        if (userData.stats) {
            const statsEl = document.createElement('div');
            statsEl.className = 'mlnf-profile-preview__stats';
            statsEl.innerHTML = `
                <div class="mlnf-stats-grid">
                    <div class="mlnf-stat">
                        <span class="mlnf-stat__value">${userData.stats.posts || 0}</span>
                        <span class="mlnf-stat__label">Chronicles</span>
                    </div>
                    <div class="mlnf-stat">
                        <span class="mlnf-stat__value">${userData.stats.comments || 0}</span>
                        <span class="mlnf-stat__label">Reflections</span>
                    </div>
                    <div class="mlnf-stat">
                        <span class="mlnf-stat__value">${userData.stats.connections || 0}</span>
                        <span class="mlnf-stat__label">Connections</span>
                    </div>
                </div>
            `;
            body.appendChild(statsEl);
        }
        
        // Create immortal-themed action buttons
        actions.innerHTML = `
            <button class="mlnf-btn mlnf-btn--primary" onclick="MLNFProfileRouter.navigateToProfile('${userData.username}')">
                <span class="font-immortal-heading">View Full Profile</span>
            </button>
            <button class="mlnf-btn mlnf-btn--accent" onclick="window.MLNF.openMessageModal('${userData.username}')">
                <span class="font-immortal-mystical">Send Message</span>
            </button>
        `;
    }
    
    static addModalEventListeners(modal) {
        // Close button
        const closeBtn = modal.querySelector('.mlnf-profile-preview__close');
        closeBtn.addEventListener('click', () => this.closePreview());
        
        // Backdrop click
        const backdrop = modal.querySelector('.mlnf-profile-preview__backdrop');
        backdrop.addEventListener('click', () => this.closePreview());
        
        // Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closePreview();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    static closePreview() {
        if (this.currentModal) {
            this.currentModal.classList.add('mlnf-profile-preview--closing');
            setTimeout(() => {
                if (this.currentModal) {
                    this.currentModal.remove();
                    this.currentModal = null;
                }
            }, 300);
        }
    }
    
    static showError(message) {
        // Simple error notification using existing MLNF notification system
        console.error('[MLNF Profile Preview]', message);
        // Could integrate with existing notification system here
    }
}

class MLNFAvatarSystem {
    constructor() {
        this.defaultAvatarConfig = {
            background: 'ff5e78',
            color: 'fff',
            format: 'svg'
        };
    }

    /**
     * Generate unique color based on username
     * @param {string} username - Username for color generation
     * @returns {Object} Background and text colors
     */
    generateUserColors(username) {
        // Simple hash function to generate consistent colors per username
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Immortal-themed color palette
        const immortalColors = [
            { bg: 'ff5e78', text: 'fff' }, // Pink/white
            { bg: 'ffca28', text: '0d0d1a' }, // Gold/dark
            { bg: '4ade80', text: 'fff' }, // Green/white
            { bg: '60a5fa', text: 'fff' }, // Blue/white
            { bg: 'c084fc', text: 'fff' }, // Purple/white
            { bg: 'f97316', text: 'fff' }, // Orange/white
            { bg: 'ef4444', text: 'fff' }, // Red/white
            { bg: '06b6d4', text: 'fff' }, // Cyan/white
            { bg: 'a855f7', text: 'fff' }, // Violet/white
            { bg: '10b981', text: 'fff' }, // Emerald/white
        ];
        
        const colorIndex = Math.abs(hash) % immortalColors.length;
        return immortalColors[colorIndex];
    }

    /**
     * Generate avatar URL with fallback
     * @param {string} username - Username for avatar generation
     * @param {number} size - Avatar size in pixels
     * @param {string} customUrl - Custom avatar URL (optional)
     * @returns {string} Avatar URL
     */
    generateAvatarUrl(username = 'Anonymous', size = 40, customUrl = null) {
        if (customUrl) {
            return customUrl;
        }
        
        // Generate unique colors for this username
        const colors = this.generateUserColors(username);
        
        const encodedName = encodeURIComponent(username);
        const generatedUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=${colors.bg}&color=${colors.text}&size=${size}&format=${this.defaultAvatarConfig.format}`;
        return generatedUrl;
    }

    /**
     * Create avatar element with proper classes
     * @param {Object} options - Avatar configuration
     * @returns {HTMLElement} Avatar image element
     */
    createAvatar(options = {}) {
        const {
            username = 'Anonymous',
            size = 'md',
            customUrl = null,
            mystical = false,
            online = null,
            classes = []
        } = options;

        const img = document.createElement('img');
        const sizeMap = {
            'xs': 20, 'sm': 28, 'md': 36, 'lg': 48, 'xl': 64, 'xxl': 80
        };
        
        const pixelSize = sizeMap[size] || 36;
        
        const avatarUrl = this.generateAvatarUrl(username, pixelSize, customUrl);
        const fallbackUrl = this.generateAvatarUrl(username, pixelSize, null); // Force fallback to UI-Avatars

        img.src = avatarUrl;
        img.alt = username;
        img.className = `mlnf-avatar mlnf-avatar--${size}`;
        img.loading = 'lazy';
        
        // Add optional classes
        if (mystical) img.classList.add('mlnf-avatar--mystical');
        
        // Create container for avatar + status dot
        const avatarContainer = document.createElement('div');
        avatarContainer.style.position = 'relative';
        avatarContainer.style.display = 'inline-block';
        avatarContainer.appendChild(img);
        
        // Add online status dot if specified
        if (online === true || online === false) {
            const statusDot = document.createElement('div');
            statusDot.className = 'online-dot';
            if (online === true) {
                statusDot.classList.add('online');
            }
            avatarContainer.appendChild(statusDot);
        }
        classes.forEach(cls => img.classList.add(cls));

        // Enhanced error handling for avatar loading
        img.onerror = () => {
            console.warn(`[MLNF Avatar] Primary avatar failed for ${username}, trying fallback: ${fallbackUrl}`);
            if (img.src !== fallbackUrl) {
                img.src = fallbackUrl;
            } else {
                console.error(`[MLNF Avatar] Both primary and fallback failed for ${username}`);
                // Last resort: use a default avatar
                img.src = window.MLNF_CONFIG?.DEFAULT_AVATAR || '/assets/images/default.jpg';
            }
            img.onerror = null; // Prevent infinite loop
        };

        return online === true || online === false ? avatarContainer : img;
    }

    /**
     * Create complete user display component
     * @param {Object} options - User display configuration
     * @returns {HTMLElement} Complete user display element
     */
    createUserDisplay(options = {}) {
        const {
            username = 'Anonymous',
            title = 'Eternal Soul',
            status = null,
            avatarSize = 'md',
            displaySize = 'md',
            compact = false,
            mystical = false,
            online = null,
            customAvatar = null,
            usernameStyle = 'immortal', // 'immortal', 'mystical', 'eternal', or 'default'
            clickable = true,
            onClick = null,
            enableUnifiedNavigation = true,
            banned = false
        } = options;

        // Create container
        const container = document.createElement('div');
        const containerClasses = ['mlnf-user-display', `mlnf-user-display--${displaySize}`];
        
        if (compact) containerClasses.push('mlnf-user-display--compact');
        if (banned) containerClasses.push('mlnf-user-display--banned');
        if (clickable) container.style.cursor = 'pointer';
        
        container.className = containerClasses.join(' ');

        // Create avatar
        const avatar = this.createAvatar({
            username,
            size: avatarSize,
            customUrl: customAvatar,
            mystical,
            online
        });

        // Create user info container
        const userInfo = document.createElement('div');
        userInfo.className = 'mlnf-user-info';

        // Create username element
        const usernameEl = document.createElement('span');
        const usernameClasses = ['mlnf-username'];
        if (usernameStyle !== 'default') {
            usernameClasses.push(`mlnf-username--${usernameStyle}`);
        }
        usernameEl.className = usernameClasses.join(' ');
        usernameEl.textContent = username;
        
        // Add ban icon if user is banned
        if (banned) {
            const banIcon = document.createElement('i');
            banIcon.className = 'fas fa-ban mlnf-ban-icon';
            banIcon.title = 'This soul has been banned';
            usernameEl.appendChild(document.createTextNode(' '));
            usernameEl.appendChild(banIcon);
        }

        // Create title element
        const titleEl = document.createElement('span');
        titleEl.className = 'mlnf-user-title';
        titleEl.textContent = title;

        // Add elements to user info
        userInfo.appendChild(usernameEl);
        userInfo.appendChild(titleEl);

        // Add status if provided
        if (status) {
            const statusEl = document.createElement('span');
            statusEl.className = 'mlnf-user-status';
            statusEl.textContent = status;
            userInfo.appendChild(statusEl);
        }

        // Assemble component
        container.appendChild(avatar);
        container.appendChild(userInfo);

        // Add unified click handler with enhanced navigation
        if (enableUnifiedNavigation && clickable && !banned) {
            // Create unified click handler with keyboard shortcuts
            const unifiedHandler = MLNFProfileRouter.createUnifiedClickHandler(username);
            container.addEventListener('click', unifiedHandler);
            
            // Add accessibility attributes
            container.setAttribute('role', 'button');
            container.setAttribute('aria-label', `View profile for ${username}`);
            container.setAttribute('tabindex', '0');
            container.style.cursor = 'pointer';
            
            // Add keyboard support
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    unifiedHandler(e);
                }
            });
            
            // Add immortal hover effect
            container.classList.add('mlnf-user-display--interactive');
        } else if (onClick) {
            // Use custom click handler
            container.addEventListener('click', onClick);
        }

        return container;
    }

    /**
     * Create immortal-themed text element
     * @param {string} text - Text content
     * @param {Object} options - Text styling options
     * @returns {HTMLElement} Styled text element
     */
    createImmortalText(text, options = {}) {
        const {
            element = 'span',
            font = 'heading', // 'heading', 'mystical', 'gothic', 'ancient'
            effect = null, // 'glow', 'gradient', 'pulse'
            classes = []
        } = options;

        const el = document.createElement(element);
        el.textContent = text;
        
        const textClasses = [`font-immortal-${font}`];
        if (effect) textClasses.push(`text-immortal-${effect}`);
        textClasses.push(...classes);
        
        el.className = textClasses.join(' ');
        return el;
    }

    /**
     * Update existing avatar element to use MLNF system
     * @param {HTMLElement} avatarElement - Existing avatar element
     * @param {Object} options - Update options
     */
    upgradeAvatar(avatarElement, options = {}) {
        const {
            size = 'md',
            mystical = false,
            online = null
        } = options;

        avatarElement.className = `mlnf-avatar mlnf-avatar--${size}`;
        
        if (mystical) avatarElement.classList.add('mlnf-avatar--mystical');
        if (online === true) avatarElement.classList.add('mlnf-avatar--online');
        if (online === false) avatarElement.classList.add('mlnf-avatar--offline');
    }

    /**
     * Test avatar URL generation for debugging
     */
    testAvatarGeneration() {
        // Avatar generation testing method - debug logs removed for production
        const testUsers = [
            { username: 'TestUser1', avatar: null },
            { username: 'TestUser2', avatar: 'https://example.com/avatar.jpg' },
            { username: 'Special Characters!@#', avatar: null }
        ];
        
        testUsers.forEach(user => {
            const url = this.generateAvatarUrl(user.username, 40, user.avatar);
        });
    }

    /**
     * Test UI-Avatars network connectivity
     * Note: Disabled by default due to CORS issues with ui-avatars.com
     */
    async testUIAvatarsConnectivity() {
        const testUrl = 'https://ui-avatars.com/api/?name=Test&background=ff5e78&color=fff&size=40&format=svg';
        
        try {
            // Use no-cors mode to avoid CORS preflight issues
            const response = await fetch(testUrl, { 
                method: 'HEAD',
                mode: 'no-cors' // This prevents CORS errors but limits response access
            });
        } catch (error) {
            if (error.message.includes('CORS')) {
                console.warn('[MLNF Avatar] UI-Avatars CORS restriction detected - service still functional for avatar generation');
            } else {
                console.error('[MLNF Avatar] UI-Avatars connectivity test failed:', error);
            }
        }
    }

    /**
     * Initialize avatar system for existing elements on page
     */
    initializeExistingElements() {
        // Upgrade existing avatar elements
        const existingAvatars = document.querySelectorAll('.author-avatar, .modal-author-avatar');
        existingAvatars.forEach(avatar => {
            this.upgradeAvatar(avatar, { size: 'md' });
        });

        // Add immortal styling to existing usernames
        const existingUsernames = document.querySelectorAll('.author-username, .modal-author-username');
        existingUsernames.forEach(username => {
            username.classList.add('mlnf-username', 'mlnf-username--immortal');
        });

        // Run test for debugging
        this.testAvatarGeneration();
        
        // UI-Avatars connectivity test disabled due to CORS issues
        // this.testUIAvatarsConnectivity();
    }
}

// Create global instance
window.MLNFAvatars = new MLNFAvatarSystem();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MLNFAvatars.initializeExistingElements();
    });
} else {
    window.MLNFAvatars.initializeExistingElements();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MLNFAvatarSystem;
}