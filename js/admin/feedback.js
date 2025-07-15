// Admin Feedback JavaScript
// Handles feedback management and responses

const AdminFeedback = {
    apiBaseUrl: null,
    feedbacks: [],
    filteredFeedbacks: [],
    currentPage: 1,
    itemsPerPage: 10,

    init() {
        this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
        this.loadFeedback();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Setup event listeners for feedback management
        const refreshBtn = document.getElementById('refreshFeedbackBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadFeedback());
        }

        // Setup feedback filter controls
        const filterSelect = document.getElementById('feedbackFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.filterFeedback(e.target.value));
        }

        // Setup search functionality
        const searchInput = document.getElementById('feedbackSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchFeedback(e.target.value));
        }
    },

    async loadFeedback() {
        try {
            const tbody = document.getElementById('feedbackTableBody');
            const mobileCards = document.getElementById('mobileFeedbackCards');
            
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="loading">Summoning immortal feedback...</td></tr>';
            }
            if (mobileCards) {
                mobileCards.innerHTML = '<div class="loading">Summoning immortal feedback...</div>';
            }
            
            // Try both possible token storage keys
            let token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found - please log in again');
            }

            // Verify admin authentication
            try {
                const debugResponse = await fetch(`${this.apiBaseUrl}/debug/whoami`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    if (!debugData.isAdmin) {
                        throw new Error('Admin privileges required');
                    }
                }
            } catch (debugError) {
                console.error('Authentication verification failed:', debugError);
            }

            // Try multiple potential API endpoints for feedback
            const endpoints = [
                `${this.apiBaseUrl}/messages/feedback`,  // Primary endpoint
                `${this.apiBaseUrl}/feedback`,
                `${this.apiBaseUrl}/admin/feedback`,
                `${this.apiBaseUrl}/contact`
            ];

            let response = null;
            let lastError = null;

            for (const endpoint of endpoints) {
                try {
                    response = await fetch(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        break; // Success, exit loop
                    } else if (response.status === 404) {
                        lastError = `Endpoint not found: ${endpoint}`;
                        response = null;
                        continue; // Try next endpoint
                    } else if (response.status === 403) {
                        const errorData = await response.json().catch(() => ({}));
                        lastError = `Access denied: ${errorData.error || 'Admin role required'}`;
                        response = null;
                        continue;
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (fetchError) {
                    lastError = `${endpoint}: ${fetchError.message}`;
                    response = null;
                    continue; // Try next endpoint
                }
            }

            if (!response || !response.ok) {
                // If all endpoints failed, show error
                this.feedbacks = [];
                this.filteredFeedbacks = [];
                this.renderFeedbackTable();
                this.showError('Feedback unavailable', 'Unable to load feedback data');
                return;
            }

            let data;
            try {
                const responseText = await response.text();
                if (responseText.trim() === '') {
                    data = [];
                } else {
                    data = JSON.parse(responseText);
                }
            } catch (parseError) {
                console.error('Failed to parse feedback response:', parseError);
                data = [];
            }
            
            this.feedbacks = Array.isArray(data) ? data : data.feedbacks || data.messages || [];
            this.filteredFeedbacks = [...this.feedbacks];
            this.renderFeedbackTable();

        } catch (error) {
            console.error('Error loading feedback:', error);
            this.showError('Failed to load feedback', error.message);
            
            // Show error in both table and mobile cards
            const errorMessage = `<tr><td colspan="5" class="error">Failed to load feedback: ${error.message}</td></tr>`;
            const mobileErrorMessage = `<div class="error">Failed to load feedback: ${error.message}</div>`;
            
            const tbody = document.getElementById('feedbackTableBody');
            const mobileCards = document.getElementById('mobileFeedbackCards');
            
            if (tbody) tbody.innerHTML = errorMessage;
            if (mobileCards) mobileCards.innerHTML = mobileErrorMessage;
        }
    },

    renderFeedbackTable() {
        const tbody = document.getElementById('feedbackTableBody');
        const mobileCards = document.getElementById('mobileFeedbackCards');

        if (this.filteredFeedbacks.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty">No feedback available yet</td></tr>';
            }
            if (mobileCards) {
                mobileCards.innerHTML = '<div class="empty">No feedback available yet</div>';
            }
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageFeedbacks = this.filteredFeedbacks.slice(startIndex, endIndex);

        // Render desktop table
        if (tbody) {
            tbody.innerHTML = pageFeedbacks.map(feedback => {
                const feedbackId = feedback._id || feedback.id || Date.now();
                const date = feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Unknown';
                const content = this.truncateText(feedback.message || feedback.content || 'No message', 100);
                const sender = feedback.username || feedback.email || feedback.name || 'Anonymous';

                return `
                    <tr class="feedback-row" data-feedback-id="${feedbackId}">
                        <td class="feedback-date">${date}</td>
                        <td class="feedback-content">
                            <div class="feedback-preview" title="${this.escapeHtml(feedback.message || feedback.content || 'No message')}">
                                ${this.escapeHtml(content)}
                            </div>
                        </td>
                        <td class="feedback-sender">${this.escapeHtml(sender)}</td>
                        <td class="feedback-actions">
                            <button class="action-btn reply" onclick="AdminFeedback.replyToFeedback('${feedbackId}')" title="Reply">
                                <i class="fas fa-reply"></i>
                            </button>
                        </td>
                        <td class="feedback-actions">
                            <button class="action-btn delete" onclick="AdminFeedback.deleteFeedback('${feedbackId}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Render mobile cards
        if (mobileCards) {
            mobileCards.innerHTML = pageFeedbacks.map(feedback => {
                const feedbackId = feedback._id || feedback.id || Date.now();
                const date = feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Unknown';
                const content = feedback.message || feedback.content || 'No message';
                const sender = feedback.username || feedback.email || feedback.name || 'Anonymous';

                return `
                    <div class="mobile-card" data-feedback-id="${feedbackId}">
                        <div class="mobile-card-header">
                            <div class="mobile-card-info">
                                <div class="mobile-card-username">Feedback from ${this.escapeHtml(sender)}</div>
                                <div class="mobile-card-meta">${date}</div>
                            </div>
                        </div>
                        <div class="mobile-card-details">
                            <div class="mobile-card-field">
                                <span class="mobile-card-label">Message</span>
                                <span class="mobile-card-value">${this.escapeHtml(this.truncateText(content, 200))}</span>
                            </div>
                        </div>
                        <div class="mobile-card-actions">
                            <button class="action-btn reply" onclick="AdminFeedback.replyToFeedback('${feedbackId}')" title="Reply">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                            <button class="action-btn delete" onclick="AdminFeedback.deleteFeedback('${feedbackId}')" title="Delete">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    replyToFeedback(feedbackId) {
        const feedback = this.feedbacks.find(f => (f._id || f.id) === feedbackId);
        if (!feedback) {
            this.showError('Feedback not found');
            return;
        }

        // Check if feedback is anonymous or from a real user
        const isAnonymous = feedback.anonymous || !feedback.sender || feedback.sender.username === 'Anonymous';
        
        if (isAnonymous) {
            this.showFeedbackModal(feedback);
        } else if (typeof MLNF !== 'undefined' && typeof MLNF.openMessageModal === 'function') {
            try {
                // Get the actual username from the sender object
                const username = feedback.sender?.username || feedback.username || feedback.email;
                if (!username || username === 'Anonymous') {
                    this.showFeedbackModal(feedback);
                    return;
                }
                
                MLNF.openMessageModal(username);
            } catch (error) {
                console.error('Error opening message modal:', error);
                this.showError('Failed to open message modal', error.message);
                this.showFeedbackModal(feedback);
            }
        } else {
            this.showFeedbackModal(feedback);
        }
    },

    showFeedbackModal(feedback) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.display = 'flex';
        
        // Extract sender info
        const senderName = feedback.sender?.username || feedback.sender?.displayName || 
                          feedback.feedbackMeta?.username || feedback.username || 
                          feedback.email || 'Anonymous';
        const isAnonymous = feedback.anonymous || senderName === 'Anonymous';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Feedback Details</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="feedback-detail">
                        <p><strong>From:</strong> ${this.escapeHtml(senderName)}${isAnonymous ? ' (Anonymous)' : ''}</p>
                        <p><strong>Date:</strong> ${new Date(feedback.createdAt || feedback.timestamp || Date.now()).toLocaleString()}</p>
                        <div class="feedback-message">
                            <strong>Message:</strong>
                            <p>${this.escapeHtml(feedback.message || feedback.content || 'No message')}</p>
                        </div>
                        ${!isAnonymous && feedback.sender?.username ? `
                            <div class="feedback-reply-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
                                <h4>Send Reply</h4>
                                <textarea id="feedbackReplyText" style="width: 100%; min-height: 100px; margin: 10px 0;" placeholder="Type your reply here..."></textarea>
                            </div>
                        ` : `
                            <div class="feedback-note" style="margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                <p style="margin: 0; color: var(--text-secondary);">
                                    <i class="fas fa-info-circle"></i> Cannot reply to anonymous feedback
                                </p>
                            </div>
                        `}
                    </div>
                </div>
                <div class="modal-actions">
                    ${!isAnonymous && feedback.sender?.username ? `
                        <button class="btn btn-primary" onclick="AdminFeedback.sendReplyFromModal('${feedback.sender.username}', '${feedback._id}')">
                            <i class="fas fa-paper-plane"></i> Send Reply
                        </button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async deleteFeedback(feedbackId) {
        if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }

        try {
            // Try both possible token storage keys
            const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/messages/feedback/${feedbackId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete feedback: ${response.status}`);
            }

            // Remove from local data and refresh display
            this.feedbacks = this.feedbacks.filter(f => (f._id || f.id) !== feedbackId);
            this.filteredFeedbacks = this.filteredFeedbacks.filter(f => (f._id || f.id) !== feedbackId);
            this.renderFeedbackTable();
            this.showSuccess('Feedback deleted successfully');

        } catch (error) {
            console.error('Error deleting feedback:', error);
            this.showError('Failed to delete feedback', error.message);
        }
    },

    filterFeedback(filterType) {
        switch (filterType) {
            case 'unread':
                this.filteredFeedbacks = this.feedbacks.filter(f => !f.read);
                break;
            case 'read':
                this.filteredFeedbacks = this.feedbacks.filter(f => f.read);
                break;
            case 'urgent':
                this.filteredFeedbacks = this.feedbacks.filter(f => f.type === 'urgent' || f.priority === 'high');
                break;
            default:
                this.filteredFeedbacks = [...this.feedbacks];
                break;
        }

        this.currentPage = 1;
        this.renderFeedbackTable();
    },

    searchFeedback(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredFeedbacks = [...this.feedbacks];
        } else {
            const searchLower = searchTerm.toLowerCase();
            this.filteredFeedbacks = this.feedbacks.filter(feedback => 
                (feedback.subject || '').toLowerCase().includes(searchLower) ||
                (feedback.message || feedback.content || '').toLowerCase().includes(searchLower) ||
                (feedback.username || feedback.email || '').toLowerCase().includes(searchLower)
            );
        }

        this.currentPage = 1;
        this.renderFeedbackTable();
    },

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showError(message, details = '') {
        console.error('Feedback Error:', message, details);
        
        // Use the dashboard notification system if available
        if (typeof AdminDashboard !== 'undefined' && AdminDashboard.showError) {
            AdminDashboard.showError(message, details);
        } else {
            // Fallback to alert
            alert(`Error: ${message}${details ? ` - ${details}` : ''}`);
        }
    },

    showSuccess(message) {
        // Use the dashboard notification system if available
        if (typeof AdminDashboard !== 'undefined' && AdminDashboard.showSuccess) {
            AdminDashboard.showSuccess(message);
        } else {
            alert(`Success: ${message}`);
        }
    },
    
    async sendReplyFromModal(username, feedbackId) {
        const replyText = document.getElementById('feedbackReplyText')?.value;
        if (!replyText?.trim()) {
            alert('Please enter a reply message');
            return;
        }
        
        try {
            const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
            const response = await fetch(`${this.apiBaseUrl}/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipientUsername: username,
                    content: `Re: Feedback - ${replyText}`
                })
            });
            
            if (response.ok) {
                this.showSuccess('Reply sent successfully');
                document.querySelector('.modal')?.remove();
            } else {
                throw new Error(`Failed to send reply: ${response.status}`);
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            this.showError('Failed to send reply', error.message);
        }
    }
};

// Make it globally available
window.AdminFeedback = AdminFeedback;