/**
 * MLNF Avatar System - Site-wide avatar and user display utilities
 * Version: 1.0
 * 
 * This utility provides consistent avatar and user display functionality
 * across the entire MLNF site with immortal-themed styling.
 */

class MLNFAvatarSystem {
    constructor() {
        this.defaultAvatarConfig = {
            background: 'ff5e78',
            color: 'fff',
            format: 'svg'
        };
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
        
        const encodedName = encodeURIComponent(username);
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${this.defaultAvatarConfig.background}&color=${this.defaultAvatarConfig.color}&size=${size}&format=${this.defaultAvatarConfig.format}`;
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
        const fallbackUrl = this.generateAvatarUrl(username, pixelSize);

        img.src = avatarUrl;
        img.alt = username;
        img.className = `mlnf-avatar mlnf-avatar--${size}`;
        img.loading = 'lazy';
        
        // Add optional classes
        if (mystical) img.classList.add('mlnf-avatar--mystical');
        if (online === true) img.classList.add('mlnf-avatar--online');
        if (online === false) img.classList.add('mlnf-avatar--offline');
        classes.forEach(cls => img.classList.add(cls));

        // Error handling for avatar loading
        img.onerror = () => {
            img.src = fallbackUrl;
            img.onerror = null; // Prevent infinite loop
        };

        return img;
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
            clickable = false,
            onClick = null
        } = options;

        // Create container
        const container = document.createElement('div');
        const containerClasses = ['mlnf-user-display', `mlnf-user-display--${displaySize}`];
        
        if (compact) containerClasses.push('mlnf-user-display--compact');
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

        // Add click handler if provided
        if (onClick) {
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

        console.log('[MLNF Avatar System] Initialized existing elements');
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