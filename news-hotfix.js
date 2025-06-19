// MLNF News Page Hotfix
// Include this on news page if issues persist

(function() {
    console.log('[MLNF Hotfix] Applying news page fixes...');
    
    // 1. Force modal visibility CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Hotfix Modal Visibility */
        .modal[aria-hidden="false"] {
            display: flex !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
        
        /* Ensure modal content is visible */
        .modal[aria-hidden="false"] .chronicle-modal,
        .modal[aria-hidden="false"] .chronicle-detail-modal,
        .modal[aria-hidden="false"] .comments-modal {
            opacity: 1 !important;
            transform: scale(1) !important;
        }
        
        /* Fallback avatar styles */
        .fallback-author {
            display: flex !important;
            align-items: center !important;
            gap: 0.75rem !important;
        }
        
        .fallback-avatar {
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            background: #d4af37 !important;
            color: #1a1a33 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: 700 !important;
        }
    `;
    document.head.appendChild(style);
    console.log('[MLNF Hotfix] Modal CSS override applied');
    
    // 2. Wait for avatar system and patch if needed
    const patchAvatarSystem = () => {
        if (window.MLNFAvatars) {
            console.log('[MLNF Hotfix] Avatar system found, patching...');
            
            // Store original method
            const originalCreateUserDisplay = window.MLNFAvatars.createUserDisplay;
            
            // Override with error handling
            window.MLNFAvatars.createUserDisplay = function(options) {
                try {
                    // Ensure options is an object
                    if (typeof options !== 'object') {
                        options = { username: options };
                    }
                    
                    return originalCreateUserDisplay.call(this, options);
                } catch (error) {
                    console.error('[MLNF Hotfix] Avatar creation failed, using fallback:', error);
                    
                    // Create fallback
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-author';
                    fallback.innerHTML = `
                        <div class="fallback-avatar">${(options.username || 'A')[0].toUpperCase()}</div>
                        <span class="fallback-name">${options.username || 'Anonymous'}</span>
                    `;
                    return fallback;
                }
            };
            
            console.log('[MLNF Hotfix] Avatar system patched');
        } else {
            // Retry in 100ms
            setTimeout(patchAvatarSystem, 100);
        }
    };
    
    // 3. Ensure modal functions work
    window.openModalSafely = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            console.log(`[MLNF Hotfix] Opened modal: ${modalId}`);
        } else {
            console.error(`[MLNF Hotfix] Modal not found: ${modalId}`);
        }
    };
    
    window.closeModalSafely = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            console.log(`[MLNF Hotfix] Closed modal: ${modalId}`);
        }
    };
    
    // Start patching
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchAvatarSystem);
    } else {
        patchAvatarSystem();
    }
    
    console.log('[MLNF Hotfix] Complete - modals should work with aria-hidden, avatars have fallback');
})(); 