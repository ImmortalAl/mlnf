// Feedback JavaScript
// Handles feedback management and responses

const AdminFeedback = {
    apiBaseUrl: null,
    feedbacks: [],

    init() {
        console.log('Initializing Admin Feedback...');
        this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
        this.loadFeedback();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Setup any event listeners for feedback management
    },

    async loadFeedback() {
        try {
            const tbody = document.getElementById('feedbackTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="loading">Summoning immortal feedback...</td></tr>';
            }

            // For now, show placeholder feedback since there's no feedback endpoint yet
            // In a real implementation, you would fetch from an actual feedback API
            this.feedbacks = [
                {
                    id: '1',
                    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    content: 'The eternal realm feels truly magnificent! Thank you for creating this space.',
                    sender: 'EternalSeeker',
                    replied: false
                },
                {
                    id: '2',
                    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
                    content: 'Could we have more customization options for profiles?',
                    sender: 'CuriousSoul',
                    replied: true
                },
                {
                    id: '3',
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    content: 'Love the concept! The community is growing beautifully.',
                    sender: 'WisdomKeeper',
                    replied: false
                }
            ];

            this.renderFeedbackTable();

        } catch (error) {
            console.error('Error loading feedback:', error);
            this.showError('Failed to load feedback');
        }
    },

    renderFeedbackTable() {
        const tbody = document.getElementById('feedbackTableBody');
        if (!tbody) return;

        if (this.feedbacks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No feedback found</td></tr>';
            return;
        }

        tbody.innerHTML = this.feedbacks.map(feedback => `
            <tr class="feedback-row" data-feedback-id="${feedback.id}">
                <td class="feedback-date">${this.formatDate(feedback.date)}</td>
                <td class="feedback-content">
                    <div class="content-preview">${this.truncateText(feedback.content, 80)}</div>
                    ${feedback.content.length > 80 ? 
                        `<button class="expand-btn" onclick="AdminFeedback.expandContent('${feedback.id}')">
                            <i class="fas fa-expand"></i>
                        </button>` : ''
                    }
                </td>
                <td class="feedback-sender">${feedback.sender}</td>
                <td class="feedback-reply">
                    ${feedback.replied ? 
                        '<span class="status-badge replied">Replied</span>' :
                        `<button class="action-btn reply" onclick="AdminFeedback.replyToFeedback('${feedback.id}')" title="Reply">
                            <i class="fas fa-reply"></i>
                        </button>`
                    }
                </td>
                <td class="feedback-delete">
                    <button class="action-btn delete" onclick="AdminFeedback.deleteFeedback('${feedback.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    expandContent(feedbackId) {
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (!feedback) return;

        this.showModal('Full Feedback', `
            <div class="feedback-detail">
                <div class="feedback-header">
                    <h4>From: ${feedback.sender}</h4>
                    <p class="feedback-date">${this.formatDate(feedback.date)}</p>
                </div>
                <div class="feedback-content">
                    <p>${feedback.content}</p>
                </div>
                <div class="feedback-actions">
                    ${!feedback.replied ? 
                        `<button class="btn btn-primary" onclick="AdminFeedback.replyToFeedback('${feedback.id}')">
                            Reply to this Soul
                        </button>` : 
                        '<p class="status-text">Already replied to this feedback</p>'
                    }
                </div>
            </div>
        `);
    },

    replyToFeedback(feedbackId) {
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (!feedback) return;

        this.showModal('Reply to Eternal Soul', `
            <div class="reply-form">
                <div class="original-feedback">
                    <h4>Original Feedback:</h4>
                    <p class="original-content">${feedback.content}</p>
                    <p class="original-sender">From: ${feedback.sender}</p>
                </div>
                <div class="reply-input">
                    <label for="replyMessage">Your Response:</label>
                    <textarea id="replyMessage" rows="4" placeholder="Write your eternal response..."></textarea>
                </div>
                <div class="reply-actions">
                    <button class="btn btn-primary" onclick="AdminFeedback.sendReply('${feedbackId}')">
                        Send Eternal Response
                    </button>
                    <button class="btn btn-outline" onclick="AdminFeedback.closeModal()">
                        Cancel
                    </button>
                </div>
            </div>
        `);
    },

    sendReply(feedbackId) {
        const replyMessage = document.getElementById('replyMessage');
        if (!replyMessage || !replyMessage.value.trim()) {
            alert('Please enter a reply message');
            return;
        }

        // In a real implementation, you would send this to the backend
        console.log('Sending reply to feedback:', feedbackId, replyMessage.value);

        // Mark as replied
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (feedback) {
            feedback.replied = true;
        }

        this.renderFeedbackTable();
        this.closeModal();
        
        // Show success message
        alert('Reply sent successfully! The soul will receive your eternal wisdom.');
    },

    deleteFeedback(feedbackId) {
        if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }

        // Remove from local array (in real implementation, delete from backend)
        this.feedbacks = this.feedbacks.filter(f => f.id !== feedbackId);
        this.renderFeedbackTable();
        
        console.log('Feedback deleted:', feedbackId);
    },

    showModal(title, content) {
        // Check if we need to use the message modal or create a custom one
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('messageTitle');
        const modalHistory = document.getElementById('messageHistory');
        
        if (modal && modalTitle && modalHistory) {
            modalTitle.textContent = title;
            modalHistory.innerHTML = content;
            modal.style.display = 'block';
            modal.setAttribute('aria-hidden', 'false');
            
            // Hide the input section for feedback modals
            const messageInput = document.getElementById('messageInput');
            const sendBtn = document.getElementById('sendMessageBtn');
            if (messageInput) messageInput.style.display = 'none';
            if (sendBtn) sendBtn.style.display = 'none';
        }
    },

    closeModal() {
        const modal = document.getElementById('messageModal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            
            // Restore the input section
            const messageInput = document.getElementById('messageInput');
            const sendBtn = document.getElementById('sendMessageBtn');
            if (messageInput) messageInput.style.display = 'block';
            if (sendBtn) sendBtn.style.display = 'block';
        }
    },

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showError(message) {
        console.error('Feedback Error:', message);
        // Could show a toast notification or error banner
    }
};

// Make it globally available
window.AdminFeedback = AdminFeedback;
