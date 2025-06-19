// Comments System Management
const CommentsSystem = {
    modal: null,
    currentTargetType: null,
    currentTargetId: null,
    comments: [],
    loading: false,

    init() {
        this.modal = document.getElementById('commentsModal');
        if (!this.modal) {
            console.error('Comments Modal not found');
            return;
        }

        this.setupEventListeners();
    },

    setupEventListeners() {
        // Close modal events
        const closeBtn = this.modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Submit comment
        const submitBtn = this.modal.querySelector('#submitCommentBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubmitComment();
            });
        }

        // Listen for ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });

        // Listen for Enter key in comment input (with Shift+Enter for new line)
        const commentInput = this.modal.querySelector('#newCommentText');
        if (commentInput) {
            commentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSubmitComment();
                }
            });

            // Character count
            commentInput.addEventListener('input', (e) => {
                this.updateCharacterCount(e.target.value.length);
            });
        }

        // Setup character count display
        this.updateCharacterCount(0);
    },

    async openComments(targetType, targetId) {
        this.currentTargetType = targetType;
        this.currentTargetId = targetId;
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        await this.loadComments();
        
        // Focus on comment input
        setTimeout(() => {
            const commentInput = this.modal.querySelector('#newCommentText');
            if (commentInput) commentInput.focus();
        }, 100);
    },

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.resetForm();
        this.currentTargetType = null;
        this.currentTargetId = null;
        this.comments = [];
    },

    resetForm() {
        const commentInput = this.modal.querySelector('#newCommentText');
        if (commentInput) {
            commentInput.value = '';
        }
        this.updateCharacterCount(0);
        this.clearFeedback();
    },

    async loadComments() {
        if (this.loading) return;
        
        this.loading = true;
        this.showLoadingState();

        try {
            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/comments/${this.currentTargetType}/${this.currentTargetId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load comments');
            }
            
            this.comments = await response.json();
            this.renderComments();
            
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Failed to load comments');
        } finally {
            this.loading = false;
        }
    },

    renderComments() {
        const container = this.modal.querySelector('#commentsContainer');
        if (!container) return;

        if (this.comments.length === 0) {
            container.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comments"></i>
                    <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.comments.map(comment => this.createCommentElement(comment)).join('');
    },

    createCommentElement(comment) {
        const commentDate = new Date(comment.createdAt).toLocaleString();
        const isEdited = comment.isEdited ? '<span class="edited-indicator">(edited)</span>' : '';
        const isCurrentUser = this.isCurrentUserAuthor(comment);

        return `
            <div class="comment-item" data-comment-id="${comment._id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="mlnf-user-display mlnf-user-display--sm">
                            <div class="mlnf-avatar mlnf-avatar--sm">
                                <img src="${comment.author?.avatar || '/assets/images/default.jpg'}" 
                                     alt="${comment.author?.displayName || comment.author?.username || 'Unknown'}" />
                            </div>
                            <div class="mlnf-user-info">
                                <span class="mlnf-username">${comment.author?.displayName || comment.author?.username || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="comment-meta">
                        <span class="comment-date">${commentDate}</span>
                        ${isEdited}
                        ${isCurrentUser ? `
                            <div class="comment-actions">
                                <button class="edit-comment-btn" data-comment-id="${comment._id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-comment-btn" data-comment-id="${comment._id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="comment-content">
                    <div class="comment-text" data-comment-id="${comment._id}">
                        ${this.formatCommentContent(comment.content)}
                    </div>
                </div>
            </div>
        `;
    },

    formatCommentContent(content) {
        if (!content) return '';
        
        // Convert newlines to <br> and escape HTML
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    isCurrentUserAuthor(comment) {
        const currentUser = window.AuthManager?.getCurrentUser();
        return currentUser && comment.author && comment.author._id === currentUser.id;
    },

    async handleSubmitComment() {
        const commentInput = this.modal.querySelector('#newCommentText');
        const content = commentInput?.value?.trim();

        if (!content) {
            this.showError('Please enter a comment');
            return;
        }

        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) {
                window.AuthManager?.openLoginModal();
                return;
            }

            this.setSubmittingState(true);

            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: content,
                    targetType: this.currentTargetType,
                    targetId: this.currentTargetId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit comment');
            }

            // Add the new comment to the list and re-render
            this.comments.unshift(result);
            this.renderComments();
            
            // Clear the input
            commentInput.value = '';
            this.clearFeedback();

            // Update comment count in the main feed
            this.updateCommentCount();
            
        } catch (error) {
            console.error('Error submitting comment:', error);
            this.showError(error.message);
        } finally {
            this.setSubmittingState(false);
        }
    },

    async handleEditComment(commentId) {
        // Implementation for editing comments
        const comment = this.comments.find(c => c._id === commentId);
        if (!comment) return;

        const newContent = prompt('Edit your comment:', comment.content);
        if (newContent === null || newContent.trim() === comment.content) return;

        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) {
                window.AuthManager?.openLoginModal();
                return;
            }

            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newContent.trim()
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update comment');
            }

            // Update the comment in the list
            const commentIndex = this.comments.findIndex(c => c._id === commentId);
            if (commentIndex !== -1) {
                this.comments[commentIndex] = result;
                this.renderComments();
            }

        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Failed to update comment: ' + error.message);
        }
    },

    async handleDeleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) {
                window.AuthManager?.openLoginModal();
                return;
            }

            const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete comment');
            }

            // Remove the comment from the list
            this.comments = this.comments.filter(c => c._id !== commentId);
            this.renderComments();

            // Update comment count in the main feed
            this.updateCommentCount();

        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment: ' + error.message);
        }
    },

    updateCommentCount() {
        // Update the comment count in the main chronicles feed
        const chronicleElement = document.querySelector(`[data-chronicle-id="${this.currentTargetId}"]`);
        if (chronicleElement) {
            const commentCountElement = chronicleElement.querySelector('.comment-count');
            if (commentCountElement) {
                commentCountElement.textContent = this.comments.length;
            }
        }
    },

    setSubmittingState(isSubmitting) {
        const submitBtn = this.modal.querySelector('#submitCommentBtn');
        const commentInput = this.modal.querySelector('#newCommentText');

        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            submitBtn.innerHTML = isSubmitting 
                ? '<i class="fas fa-spinner fa-spin"></i> Posting...'
                : '<i class="fas fa-paper-plane"></i> Post Comment';
        }

        if (commentInput) {
            commentInput.disabled = isSubmitting;
        }
    },

    showLoadingState() {
        const container = this.modal.querySelector('#commentsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-comments">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading comments...</p>
                </div>
            `;
        }
    },

    showError(message) {
        this.showFeedback(message, 'error');
    },

    showSuccess(message) {
        this.showFeedback(message, 'success');
    },

    showFeedback(message, type) {
        const feedbackElement = this.modal.querySelector('#commentFeedback');
        if (feedbackElement) {
            feedbackElement.textContent = message;
            feedbackElement.className = `modal-feedback ${type}`;
            feedbackElement.style.display = 'block';
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => this.clearFeedback(), 3000);
            }
        }
    },

    clearFeedback() {
        const feedbackElement = this.modal.querySelector('#commentFeedback');
        if (feedbackElement) {
            feedbackElement.textContent = '';
            feedbackElement.style.display = 'none';
        }
    },

    updateCharacterCount(count) {
        const charCountElement = this.modal.querySelector('#commentCharCount');
        if (charCountElement) {
            charCountElement.textContent = count;
            
            // Change color based on character count
            const countElement = charCountElement.parentElement;
            if (count > 900) {
                countElement.style.color = 'var(--danger)';
            } else if (count > 800) {
                countElement.style.color = 'var(--warning)';
            } else {
                countElement.style.color = 'var(--text-muted)';
            }
        }
    }
};

// Event delegation for comment actions (edit/delete)
document.addEventListener('click', function(e) {
    if (e.target.closest('.edit-comment-btn')) {
        const commentId = e.target.closest('.edit-comment-btn').dataset.commentId;
        window.CommentsSystem?.handleEditComment(commentId);
    }
    
    if (e.target.closest('.delete-comment-btn')) {
        const commentId = e.target.closest('.delete-comment-btn').dataset.commentId;
        window.CommentsSystem?.handleDeleteComment(commentId);
    }
});

// Make available globally
window.CommentsSystem = CommentsSystem;
