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
                e.preventDefault();
                this.showUserContextMenu(e, userElement.getAttribute('data-user-id'));
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
            const token = localStorage.getItem('token');
            if (!token) {
                window.authManager.showModal('login');
                return;
            }

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
        if (window.governanceSystem) {
            window.governanceSystem.showNotification(message, type);
        }
    }

    // Add flag buttons to user displays
    enhanceUserDisplays() {
        const userDisplays = document.querySelectorAll('.user-display');
        userDisplays.forEach(display => {
            if (!display.querySelector('.flag-user-btn')) {
                const userId = display.getAttribute('data-user-id');
                if (userId && window.authManager.isLoggedIn()) {
                    const flagBtn = document.createElement('button');
                    flagBtn.className = 'flag-user-btn btn-ghost';
                    flagBtn.setAttribute('data-user-id', userId);
                    flagBtn.innerHTML = '<i class="fas fa-flag"></i>';
                    flagBtn.title = 'Flag for community review';
                    display.appendChild(flagBtn);
                }
            }
        });
    }
}

// Initialize system
document.addEventListener('DOMContentLoaded', () => {
    window.moderationSystem = new CommunityModerationSystem();
    
    // Enhance user displays after they're created
    setTimeout(() => {
        window.moderationSystem.enhanceUserDisplays();
    }, 2000);
});

// CSS for moderation system
const moderationCSS = `
.user-context-menu {
    background: var(--surface-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 0.5rem 0;
    min-width: 160px;
}

.context-menu-item {
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
    transition: background 0.2s ease;
}

.context-menu-item:hover {
    background: var(--surface-secondary);
}

.flag-user-btn {
    opacity: 0.6;
    padding: 0.25rem;
    margin-left: 0.5rem;
}

.flag-user-btn:hover {
    opacity: 1;
    color: #f59e0b;
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
    background: var(--surface-primary);
    border: 2px solid #f59e0b;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 300px;
}

.moderation-notification .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
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
const style = document.createElement('style');
style.textContent = moderationCSS;
document.head.appendChild(style); 