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
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            // Update modal title
            const title = document.getElementById('commentsModalTitle');
            if (title) {
                title.innerHTML = '<i class="fas fa-comments"></i> Chronicle Comments';
            }
        }
    }

    closeComments() {
        const modal = document.getElementById('commentsModal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            this.currentChronicleId = null;
            this.comments = [];
        }
    }

    async loadComments() {
        try {
            // For now, show a placeholder since comments system isn't fully implemented
            // TODO: Once comments backend is ready, uncomment the API call below
            
            /*
            const response = await window.apiClient.get(`/chronicles/${this.currentChronicleId}/comments`);
            this.comments = response.comments || [];
            this.renderComments();
            */
            
            this.renderCommentsPlaceholder();
            
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Failed to load comments.');
        }
    }

    renderCommentsPlaceholder() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        const isLoggedIn = window.authManager && window.authManager.isLoggedIn();

        container.innerHTML = `
            <div class="comments-placeholder">
                <div class="placeholder-icon">
                    <i class="fas fa-comments" style="font-size: 3rem; color: var(--immortal-gold); margin-bottom: 1rem;"></i>
                </div>
                <h3 style="color: var(--immortal-gold); margin-bottom: 1rem;">Eternal Echoes</h3>
                <p style="margin-bottom: 2rem; color: var(--text-secondary);">
                    Share your thoughts on this chronicle. Your eternal echoes will be preserved for all to see.
                </p>
                
                ${isLoggedIn ? this.renderCommentForm() : this.renderAuthPrompt()}
                
                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                    <p><strong style="color: var(--immortal-gold);">Development Status:</strong></p>
                    <ul style="text-align: left; max-width: 400px; margin: 1rem auto; color: var(--text-secondary);">
                    <li>✅ Chronicle submission and editing</li>
                        <li>✅ Immortal voting system (Consecrate/Investigate)</li>
                        <li>✅ Comments form interface (ready)</li>
                        <li>🔄 Comments backend integration (in development)</li>
                        <li>🔄 Real-time comment updates</li>
                </ul>
                </div>
                
                <button class="btn btn-outline" onclick="window.commentsSystem.closeComments()" style="margin-top: 1.5rem;">
                    <i class="fas fa-arrow-left"></i> Return to Chronicle
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
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <i class="fas fa-comment-slash" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                        <p style="color: var(--text-secondary);">No comments yet. Be the first to share your eternal echo!</p>
                    </div>
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
                    <div class="comment-author-info">
                        <!-- MLNF Avatar System will populate this -->
                    </div>
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
            return this.renderAuthPrompt();
        }

        return `
            <div class="comment-form">
                <h4><i class="fas fa-quill-pen"></i> Share Your Eternal Echo</h4>
                <form id="commentForm">
                    <div class="form-group">
                    <textarea 
                        id="commentContent" 
                        name="content" 
                        placeholder="Express your thoughts on this chronicle..." 
                        required
                        rows="4"
                    ></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Post Echo
                        </button>
                        <button type="button" class="btn btn-outline" onclick="window.commentsSystem.closeComments()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    renderAuthPrompt() {
        return `
            <div class="comment-auth-prompt">
                <div style="text-align: center;">
                    <i class="fas fa-sign-in-alt" style="font-size: 2rem; color: var(--immortal-gold); margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--immortal-gold); margin-bottom: 1rem;">Join the Eternal Conversation</h4>
                    <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
                        Please enter the sanctuary to share your thoughts and add your voice to the eternal chronicles.
                    </p>
                    <button class="btn btn-primary" onclick="window.MLNF.openSoulModal('login')">
                        <i class="fas fa-infinity"></i> Enter the Sanctuary
                    </button>
                </div>
            </div>
        `;
    }

    async handleCommentSubmission(e) {
        e.preventDefault();
        
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showError('Please log in to post a comment.');
            return;
        }

        if (!this.currentChronicleId) {
            this.showError('Error: No chronicle selected.');
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        const content = formData.get('content')?.trim();

        if (!content) {
            this.showError('Please enter your comment.');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

            // TODO: Implement actual comment submission when backend is ready
            /*
            const response = await window.apiClient.post(`/chronicles/${this.currentChronicleId}/comments`, {
                content: content
            });
            
            // Add new comment to list
            this.comments.unshift(response.comment);
            this.renderComments();
            */

            // For now, show success message and simulate comment posting
            this.showSuccess('Comment posted successfully! (Demo mode - backend integration pending)');
            form.reset();
            
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showError('Failed to post comment. Please try again.');
        } finally {
            // Re-enable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Echo';
            }
        }
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
            // Create error element
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.cssText = `
                color: var(--error);
                background: rgba(220, 53, 69, 0.1);
                border: 1px solid var(--error);
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            `;
            errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

            // Remove any existing errors
            const existingErrors = container.querySelectorAll('.error-message');
            existingErrors.forEach(error => error.remove());

            // Add new error
            container.insertBefore(errorElement, container.firstChild);

            // Remove error after 5 seconds
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
        }
            }, 5000);
        }
    }

    showSuccess(message) {
        // Create temporary success notification
        const successElement = document.createElement('div');
        successElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        successElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(successElement);

        // Remove after 4 seconds
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.remove();
            }
            if (style.parentNode) {
                style.remove();
            }
        }, 4000);
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
window.CommentsSystem = CommentsSystem;
}
