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

        // Handle comment form submission using event delegation
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'commentForm') {
                e.preventDefault();
                this.handleCommentSubmission(e);
            }
        });
    }

    openComments(chronicleId) {
        this.currentChronicleId = chronicleId;
        this.loadComments();
        
        const modal = document.getElementById('commentsModal');
        if (modal) {
            modal.classList.add('show');
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
            modal.classList.remove('show');
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
                <h3>Test Comment System</h3>
                <p>The comment form below is functional for testing. Your eternal echoes will be preserved once the backend is connected.</p>
                ${this.renderCommentForm()}
                <p><strong>Current Status:</strong></p>
                <ul style="text-align: left; max-width: 400px; margin: 1rem auto;">
                    <li>✅ Chronicle submission and editing</li>
                    <li>✅ Validation and challenge voting</li>
                    <li>✅ Comments form (frontend ready)</li>
                    <li>🔄 Comments backend (in development)</li>
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

    async handleCommentSubmission(e) {
        e.preventDefault();
        
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            alert('Please log in to comment.');
            return;
        }

        if (!this.currentChronicleId) {
            alert('Error: No chronicle selected.');
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        const content = formData.get('content');

        if (!content.trim()) {
            alert('Please enter a comment.');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            // TODO: Replace with actual API call when comments backend is ready
            // const response = await window.apiClient.post(`/chronicles/${this.currentChronicleId}/comments`, {
            //     content: content.trim()
            // });

            // For now, show success message
            alert('Comment functionality is coming soon! Your eternal echo will be preserved once the system is fully forged.');
            form.reset();
            
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to submit comment. Please try again.');
        } finally {
            // Re-enable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }
}

// Make it globally available
window.CommentsSystem = CommentsSystem;
