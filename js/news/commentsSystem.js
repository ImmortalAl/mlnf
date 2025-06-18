// Comments System - Handles comments for chronicles
class CommentsSystem {
    constructor() {
        this.currentChronicleId = null;
        this.comments = [];
    }

    static init() {
        window.commentsSystem = new CommentsSystem();
        window.commentsSystem.initialize();
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal button
        const closeBtn = document.getElementById('closeCommentsModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeComments());
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.id === 'commentsModal') {
                this.closeComments();
            }
        });

        // Future: Add comment submission form listeners here
    }

    openComments(chronicleId) {
        this.currentChronicleId = chronicleId;
        this.loadComments();
        
        const modal = document.getElementById('commentsModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Update modal title
            const title = document.getElementById('commentsModalTitle');
            if (title) {
                title.textContent = 'Eternal Echoes - Chronicle Comments';
            }
        }
    }

    closeComments() {
        const modal = document.getElementById('commentsModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.currentChronicleId = null;
            this.comments = [];
        }
    }

    async loadComments() {
        try {
            // For now, show a placeholder since comments system isn't fully implemented
            this.renderCommentsPlaceholder();
            
            // TODO: Implement actual comments loading
            // const response = await window.apiClient.get(`/chronicles/${this.currentChronicleId}/comments`);
            // this.comments = response.comments || [];
            // this.renderComments();
            
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Failed to load comments.');
        }
    }

    renderCommentsPlaceholder() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="comments-placeholder">
                <div class="placeholder-icon">
                    <i class="fas fa-comments" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;"></i>
                </div>
                <h3>Comments Coming Soon</h3>
                <p>The eternal echoes system is being forged in the digital fires. Soon, souls will be able to discuss and debate the chronicles of truth.</p>
                <p><strong>Current Features Available:</strong></p>
                <ul style="text-align: left; max-width: 400px; margin: 1rem auto;">
                    <li>✅ Chronicle submission and editing</li>
                    <li>✅ Validation and challenge voting</li>
                    <li>🔄 Comments system (in development)</li>
                    <li>🔄 Real-time discussions (planned)</li>
                </ul>
                <button class="btn btn-outline" onclick="window.commentsSystem.closeComments()">
                    Return to Chronicles
                </button>
            </div>
        `;
    }

    renderComments() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        if (this.comments.length === 0) {
            container.innerHTML = `
                <div class="no-comments">
                    <p>No comments yet. Be the first to share your thoughts!</p>
                    ${this.renderCommentForm()}
                </div>
            `;
            return;
        }

        let html = '<div class="comments-list">';
        this.comments.forEach(comment => {
            html += this.createCommentElement(comment);
        });
        html += '</div>';
        html += this.renderCommentForm();

        container.innerHTML = html;
    }

    createCommentElement(comment) {
        const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="comment" data-id="${comment._id}">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHtml(comment.author.displayName || comment.author.username)}</span>
                    <span class="comment-date">${date}</span>
                </div>
                <div class="comment-content">
                    ${this.formatContent(comment.content)}
                </div>
            </div>
        `;
    }

    renderCommentForm() {
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            return `
                <div class="comment-auth-prompt">
                    <p>Please log in to share your eternal echoes.</p>
                    <button class="btn btn-primary" onclick="window.MLNF.openSoulModal('login')">
                        Enter the Sanctuary
                    </button>
                </div>
            `;
        }

        return `
            <div class="comment-form">
                <h4>Share Your Eternal Echo</h4>
                <form id="commentForm">
                    <textarea 
                        id="commentContent" 
                        name="content" 
                        placeholder="Express your thoughts on this chronicle..." 
                        required
                        rows="4"
                    ></textarea>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Post Echo</button>
                    </div>
                </form>
            </div>
        `;
    }

    formatContent(content) {
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const container = document.getElementById('commentsContainer');
        if (container) {
            container.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }
}

// Make it globally available
window.CommentsSystem = CommentsSystem;
