// Community Moderation System
// Democratic user flagging and moderation decisions

class CommunityModerationSystem {
    constructor() {
        this.activeCases = [];
        this.lastEnhancementTime = 0;
        this.enhancementCooldown = 1000; // 1 second cooldown
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadActiveCases();
    }

    setupEventListeners() {
        // Add flag user buttons to user displays
        document.addEventListener('click', (e) => {
            if (e.target.matches('.flag-user-btn')) {
                const userId = e.target.getAttribute('data-user-id');
                this.showFlagModal(userId);
            }
            
            if (e.target.matches('.vote-moderation-btn')) {
                const caseId = e.target.getAttribute('data-case-id');
                const choice = e.target.getAttribute('data-choice');
                this.voteModerationCase(caseId, choice);
            }
        });

        // Add context menu for flagging users
        document.addEventListener('contextmenu', (e) => {
            const userElement = e.target.closest('[data-user-id]');
            if (userElement && window.authManager.isLoggedIn()) {
                const userId = userElement.getAttribute('data-user-id');
                const currentUser = window.authManager.getUser();
                
                // Don't show context menu for user's own posts
                if (currentUser && userId !== currentUser._id) {
                    e.preventDefault();
                    this.showUserContextMenu(e, userId);
                }
            }
        });
    }

    showUserContextMenu(event, userId) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.user-context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'user-context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" onclick="moderationSystem.showFlagModal('${userId}')">
                <i class="fas fa-flag"></i> Flag User
            </div>
            <div class="context-menu-item" onclick="moderationSystem.viewUserHistory('${userId}')">
                <i class="fas fa-history"></i> View History
            </div>
        `;

        menu.style.position = 'fixed';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        menu.style.zIndex = '10000';

        document.body.appendChild(menu);

        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }, 100);
    }

    showFlagModal(userId) {
        if (!window.authManager.isLoggedIn()) {
            window.authManager.showModal('login');
            return;
        }

        const modalHTML = `
            <div id="flagUserModal" class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Flag User for Community Review</h3>
                        <button class="close-modal" onclick="moderationSystem.closeFlagModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="flagUserForm">
                            <div class="form-group">
                                <label for="flagReason">Reason for flagging *</label>
                                <select id="flagReason" name="reason" required>
                                    <option value="">Select a reason...</option>
                                    <option value="spam">Spam or repetitive content</option>
                                    <option value="harassment">Harassment or personal attacks</option>
                                    <option value="misinformation">Spreading misinformation</option>
                                    <option value="trolling">Disruptive trolling behavior</option>
                                    <option value="bad_faith">Arguing in bad faith</option>
                                    <option value="off_topic">Consistently off-topic posting</option>
                                    <option value="other">Other (please specify)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="flagDescription">Additional details</label>
                                <textarea id="flagDescription" name="description" rows="4"
                                          placeholder="Provide specific examples or context for this flag..."></textarea>
                            </div>
                            
                            <div class="flag-warning">
                                <p><strong>Important:</strong> Flagging is a serious action. False or malicious flags may result in penalties to your account. This will create a community moderation case if enough users flag this person.</p>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-warning">
                                    <i class="fas fa-flag"></i> Submit Flag
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="moderationSystem.closeFlagModal()">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const form = document.getElementById('flagUserForm');
        form.addEventListener('submit', (e) => this.handleFlagSubmission(e, userId));
    }

    async handleFlagSubmission(e, userId) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const flagData = {
            flaggedUserId: userId,
            reason: formData.get('reason'),
            description: formData.get('description')
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/community-mod/flag-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(flagData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Flag submitted for community review', 'success');
                this.closeFlagModal();
                
                if (data.caseCreated) {
                    this.showNotification('Moderation case created - community voting has begun', 'info');
                    this.loadActiveCases();
                }
            } else {
                this.showNotification(data.error || 'Failed to submit flag', 'error');
            }
        } catch (error) {
            console.error('Error submitting flag:', error);
            this.showNotification('Error submitting flag', 'error');
        }
    }

    closeFlagModal() {
        const modal = document.getElementById('flagUserModal');
        if (modal) modal.remove();
    }

    async loadActiveCases() {
        try {
            const response = await fetch('/api/community-mod/cases?status=active');
            const data = await response.json();
            
            if (data.success) {
                this.activeCases = data.cases;
                this.displayModerationNotification();
            }
        } catch (error) {
            console.error('Error loading moderation cases:', error);
        }
    }

    displayModerationNotification() {
        if (this.activeCases.length === 0) return;

        // Check if user has already seen these cases
        const seenCases = JSON.parse(localStorage.getItem('seenModerationCases') || '[]');
        const newCases = this.activeCases.filter(c => !seenCases.includes(c._id));
        
        if (newCases.length > 0 && window.authManager.isLoggedIn()) {
            const notification = document.createElement('div');
            notification.className = 'moderation-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-gavel"></i>
                    <div>
                        <strong>Community Moderation</strong>
                        <p>${newCases.length} moderation case${newCases.length > 1 ? 's' : ''} need${newCases.length === 1 ? 's' : ''} your vote</p>
                    </div>
                    <button onclick="moderationSystem.showModerationPanel()" class="btn btn-sm btn-primary">
                        Review Cases
                    </button>
                    <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm btn-secondary">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            document.body.appendChild(notification);

            // Mark as seen
            const allSeenCases = [...seenCases, ...newCases.map(c => c._id)];
            localStorage.setItem('seenModerationCases', JSON.stringify(allSeenCases));
        }
    }

    showModerationPanel() {
        const panelHTML = `
            <div id="moderationPanel" class="modal active">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>Community Moderation Cases</h3>
                        <button class="close-modal" onclick="moderationSystem.closeModerationPanel()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="moderationCases">
                            ${this.renderModerationCases()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
    }

    renderModerationCases() {
        if (this.activeCases.length === 0) {
            return '<p>No active moderation cases at this time.</p>';
        }

        return this.activeCases.map(moderationCase => `
            <div class="moderation-case">
                <div class="case-header">
                    <h4 class="case-title">Case: ${moderationCase.type}</h4>
                    <div class="case-meta">
                        <span class="case-type">${moderationCase.type}</span>
                        <span class="case-status">${moderationCase.status}</span>
                    </div>
                </div>
                
                <div class="case-details">
                    <p><strong>Subject:</strong> ${moderationCase.subjectUser?.username || 'Anonymous'}</p>
                    <p><strong>Flags received:</strong> ${moderationCase.flagCount}</p>
                    <p><strong>Description:</strong> ${moderationCase.description}</p>
                </div>
                
                <div class="case-voting">
                    <div class="vote-counts">
                        <div class="vote-count uphold">
                            <i class="fas fa-gavel"></i>
                            Uphold: ${moderationCase.upholdVotes} (${moderationCase.percentages?.uphold || 0}%)
                        </div>
                        <div class="vote-count dismiss">
                            <i class="fas fa-times-circle"></i>
                            Dismiss: ${moderationCase.dismissVotes} (${moderationCase.percentages?.dismiss || 0}%)
                        </div>
                    </div>
                    
                    <div class="voting-buttons">
                        <button class="btn vote-moderation-btn uphold" 
                                data-case-id="${moderationCase._id}" data-choice="uphold">
                            <i class="fas fa-gavel"></i> Uphold Moderation
                        </button>
                        <button class="btn vote-moderation-btn dismiss" 
                                data-case-id="${moderationCase._id}" data-choice="dismiss">
                            <i class="fas fa-times-circle"></i> Dismiss Case
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async voteModerationCase(caseId, choice) {
        try {
            if (!window.authManager.isLoggedIn()) {
                window.authManager.showLogin();
                return;
            }
            const token = window.authManager.getToken();

            const response = await fetch('/api/community-mod/vote-case', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ caseId, choice })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Vote cast: ${choice}`, 'success');
                this.loadActiveCases();
                // Refresh the panel
                const casesContainer = document.getElementById('moderationCases');
                if (casesContainer) {
                    casesContainer.innerHTML = this.renderModerationCases();
                }
            } else {
                this.showNotification(data.error || 'Failed to cast vote', 'error');
            }
        } catch (error) {
            console.error('Error voting on moderation case:', error);
            this.showNotification('Error voting on case', 'error');
        }
    }

    closeModerationPanel() {
        const panel = document.getElementById('moderationPanel');
        if (panel) panel.remove();
    }

    showNotification(message, type = 'info') {
        // Create notification using the same system as the messageboard
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Add flag buttons to user displays
    enhanceUserDisplays() {
        // Throttle enhancement calls to prevent rapid duplicates
        const now = Date.now();
        if (now - this.lastEnhancementTime < this.enhancementCooldown) {
            console.log(`[Moderation] Enhancement throttled, too soon since last call`);
            return;
        }
        this.lastEnhancementTime = now;
        
        // First, clean up any existing duplicate flags
        this.cleanupDuplicateFlags();
        
        const userDisplays = document.querySelectorAll('[data-user-id]');
        console.log(`[Moderation] Found ${userDisplays.length} user displays to enhance`);
        
        let buttonsAdded = 0;
        userDisplays.forEach((display) => {
            const userId = display.getAttribute('data-user-id');
            
            // Skip if already processed or no user ID
            if (!userId || display.hasAttribute('data-flag-enhanced')) {
                return;
            }
            
            // Skip if flag button already exists
            if (display.querySelector('.flag-user-btn')) {
                display.setAttribute('data-flag-enhanced', 'true');
                return;
            }
            
            const isLoggedIn = window.authManager && window.authManager.isLoggedIn();
            const currentUser = window.authManager.getUser();
            
            console.log(`[Moderation] Checking user ${userId}, logged in: ${isLoggedIn}, current user: ${currentUser?._id}`);
            
            // Don't show flag button for user's own posts
            if (isLoggedIn && currentUser && userId !== currentUser._id) {
                const flagBtn = document.createElement('button');
                flagBtn.className = 'flag-user-btn';
                flagBtn.setAttribute('data-user-id', userId);
                flagBtn.innerHTML = '<i class="fas fa-flag"></i>';
                flagBtn.title = 'Flag for community review';
                
                // Add click handler for flag button
                flagBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showFlagModal(userId);
                });
                
                display.appendChild(flagBtn);
                buttonsAdded++;
                console.log(`[Moderation] Added flag button for user ${userId}`);
            }
            
            // Always mark as enhanced to prevent future processing
            display.setAttribute('data-flag-enhanced', 'true');
        });
        
        console.log(`[Moderation] Added ${buttonsAdded} flag buttons total`);
    }
    
    // Clean up duplicate flag buttons
    cleanupDuplicateFlags() {
        const userDisplays = document.querySelectorAll('[data-user-id]');
        let cleaned = 0;
        
        userDisplays.forEach(display => {
            const flagButtons = display.querySelectorAll('.flag-user-btn');
            if (flagButtons.length > 1) {
                // Keep only the first flag button, remove the rest
                for (let i = 1; i < flagButtons.length; i++) {
                    flagButtons[i].remove();
                    cleaned++;
                }
            }
        });
        
        if (cleaned > 0) {
            console.log(`[Moderation] Cleaned up ${cleaned} duplicate flag buttons`);
        }
    }
}

// Initialize system
document.addEventListener('DOMContentLoaded', () => {
    window.moderationSystem = new CommunityModerationSystem();
    
    // Enhance user displays with multiple attempts to catch dynamically loaded content
    const enhanceWithRetry = () => {
        if (window.moderationSystem) {
            window.moderationSystem.enhanceUserDisplays();
        }
    };
    
    // Initial enhancement
    setTimeout(enhanceWithRetry, 1000);
    
    // Retry enhancement for dynamically loaded content
    setTimeout(enhanceWithRetry, 3000);
    setTimeout(enhanceWithRetry, 5000);
    
    // Set up mutation observer to automatically enhance new user displays
    const observer = new MutationObserver((mutations) => {
        let hasNewUserDisplays = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.getAttribute && node.getAttribute('data-user-id')) {
                        hasNewUserDisplays = true;
                    } else if (node.querySelector && node.querySelector('[data-user-id]')) {
                        hasNewUserDisplays = true;
                    }
                }
            });
        });
        
        if (hasNewUserDisplays) {
            setTimeout(enhanceWithRetry, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
const moderationCSS = `
.user-context-menu {
    background: rgba(26, 26, 51, 0.95);
    border: 1px solid rgba(255, 94, 120, 0.3);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    padding: 0.5rem 0;
    min-width: 180px;
    backdrop-filter: blur(10px);
}

.context-menu-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #f0e6ff;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    font-weight: 500;
}

.context-menu-item:hover {
    background: rgba(255, 94, 120, 0.1);
    color: #ff5e78;
}

.context-menu-item i {
    width: 16px;
    text-align: center;
    color: #ff5e78;
}

.flag-user-btn {
    background: transparent !important;
    border: 1px solid rgba(245, 158, 11, 0.6) !important;
    color: rgba(245, 158, 11, 0.9) !important;
    padding: 0.4rem 0.6rem !important;
    margin-left: 0.5rem !important;
    border-radius: 6px !important;
    font-size: 0.8rem !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 32px !important;
    height: 32px !important;
    position: relative !important;
    z-index: 10 !important;
}

.flag-user-btn:hover {
    background: rgba(245, 158, 11, 0.15) !important;
    border-color: #f59e0b !important;
    color: #f59e0b !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4) !important;
}

.flag-user-btn:active {
    transform: translateY(0) !important;
}

.flag-user-btn i {
    font-size: 0.9rem !important;
    pointer-events: none !important;
}

.flag-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
}

.moderation-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(26, 26, 51, 0.95);
    border: 2px solid #f59e0b;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    z-index: 10000;
    max-width: 320px;
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.moderation-notification .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    color: #f0e6ff;
}

.moderation-notification .notification-content i {
    color: #f59e0b;
    font-size: 1.25rem;
    margin-top: 0.125rem;
}

.moderation-notification .notification-content strong {
    color: #ff5e78;
    font-size: 1rem;
}

.moderation-notification .notification-content p {
    margin: 0.25rem 0 0.75rem 0;
    font-size: 0.9rem;
    opacity: 0.9;
}

.moderation-case {
    background: var(--surface-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.case-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.case-voting .voting-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.vote-moderation-btn.uphold {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 2px solid rgba(239, 68, 68, 0.3);
}

.vote-moderation-btn.dismiss {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border: 2px solid rgba(34, 197, 94, 0.3);
}

.modal-content.large {
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
}
`;

// Inject CSS
const moderationStyle = document.createElement('style');
moderationStyle.textContent = moderationCSS;
document.head.appendChild(moderationStyle); 