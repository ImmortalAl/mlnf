// Community Moderation System
// Democratic user flagging and moderation decisions

class CommunityModerationSystem {
    constructor() {
        this.activeCases = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadActiveCases();
    }

    setupEventListeners() {
        // Add flag user buttons to user displays
        document.addEventListener('click', (e) => {
            const flagBtn = e.target.closest('.flag-user-btn');
            if (flagBtn) {
                e.stopPropagation();
                const userId = flagBtn.getAttribute('data-user-id');
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
                                <input type="text" id="flagReason" name="reason" 
                                       placeholder="Briefly describe why you're flagging this user (e.g., 'harassment', 'spam')" 
                                       maxlength="200" required>
                                <small>Be specific but concise. This will be visible to the community.</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="flagDescription">Additional details</label>
                                <textarea id="flagDescription" name="description" rows="4"
                                          placeholder="Provide specific examples or context for this flag..."></textarea>
                            </div>
                            
                            <div class="flag-warning">
                                <p><strong>Important:</strong> Flagging is a serious action. False or malicious flags may result in penalties to your account. After 3 flags, a community moderation thread will be created.</p>
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
                
                if (data.discussionThreadId) {
                    this.showNotification('Community review triggered! A moderation thread has been created.', 'info');
                    // Optionally redirect to the thread
                    if (confirm('Would you like to view the moderation thread?')) {
                        window.location.href = `/pages/messageboard.html?openThread=${data.discussionThreadId}`;
                    }
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
            const data = await window.apiClient.get('/community-mod/cases?status=voting');
            
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

    async checkForModerationAlerts() {
        try {
            const data = await window.apiClient.get('/community-mod/cases?status=voting');
            
            if (data.success && data.cases.length > 0) {
                this.activeCases = data.cases;
                this.displayModerationAlertBanner();
            }
        } catch (error) {
            console.error('Error checking for moderation alerts:', error);
        }
    }

    displayModerationAlertBanner() {
        // Remove existing banner
        const existingBanner = document.querySelector('.moderation-alert-banner');
        if (existingBanner) existingBanner.remove();

        if (this.activeCases.length === 0) return;

        const activeCase = this.activeCases[0]; // Show first active case
        const lyceumsHeader = document.querySelector('.lyceum-header');
        
        if (lyceumsHeader) {
            const banner = document.createElement('div');
            banner.className = 'moderation-alert-banner';
            banner.innerHTML = `
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <h4>Community Moderation Alert</h4>
                    <p>User <strong>${activeCase.flaggedUserId.username}</strong> is under community review. 
                    ${this.activeCases.length} case${this.activeCases.length > 1 ? 's' : ''} need${this.activeCases.length === 1 ? 's' : ''} community input.</p>
                </div>
                <button class="btn btn-primary view-thread-btn" onclick="window.location.href='/pages/messageboard.html?openThread=${activeCase.discussionThreadId}'">
                    <i class="fas fa-comments"></i> View Discussion
                </button>
            `;
            
            lyceumsHeader.insertAdjacentElement('afterend', banner);
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

            const data = await window.apiClient.post('/community-mod/vote-case', { caseId, choice });
            
            if (data.success) {
                this.showNotification('Vote cast successfully!', 'success');
                this.loadActiveCases(); // Refresh cases
            } else {
                this.showNotification('Error: ' + (data.error || 'Failed to cast vote'), 'error');
            }
        } catch (error) {
            console.error('Error voting on moderation case:', error);
            this.showNotification('Error casting vote. Please try again.', 'error');
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

}

// Initialize system
document.addEventListener('DOMContentLoaded', () => {
    window.moderationSystem = new CommunityModerationSystem();
});