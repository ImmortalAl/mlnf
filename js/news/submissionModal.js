// Submission Modal - Handles submitting and editing chronicles
class SubmissionModal {
    constructor() {
        this.isEditMode = false;
        this.currentChronicleId = null;
    }

    static init() {
        window.submissionModal = new SubmissionModal();
        window.submissionModal.initialize();
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Open submission modal button
        const openBtn = document.getElementById('openSubmissionModal');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openSubmissionModal());
        }

        // Close modal buttons
        const closeBtn = document.getElementById('closeSubmissionModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSubmissionModal());
        }

        const closeEditBtn = document.getElementById('closeEditModal');
        if (closeEditBtn) {
            closeEditBtn.addEventListener('click', () => this.closeEditModal());
        }

        // Cancel buttons
        const cancelSubmissionBtn = document.getElementById('cancelSubmissionModal');
        if (cancelSubmissionBtn) {
            cancelSubmissionBtn.addEventListener('click', () => this.closeSubmissionModal());
        }

        const cancelEditBtn = document.getElementById('cancelEditModal');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        }

        // Form submissions
        const submissionForm = document.getElementById('submissionForm');
        if (submissionForm) {
            submissionForm.addEventListener('submit', (e) => this.handleSubmission(e));
        }

        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEdit(e));
        }

        // Delete button
        const deleteBtn = document.getElementById('deleteChronicle');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                if (e.target.id === 'submissionModal') {
                    this.closeSubmissionModal();
                } else if (e.target.id === 'editModal') {
                    this.closeEditModal();
                }
            }
        });
    }

    openSubmissionModal() {
        // Check if user is logged in
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            if (window.MLNF && window.MLNF.openSoulModal) {
                window.MLNF.openSoulModal('login');
            } else {
                alert('Please log in to submit a chronicle.');
            }
            return;
        }

        const modal = document.getElementById('submissionModal');
        if (modal) {
            this.resetSubmissionForm();
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    closeSubmissionModal() {
        const modal = document.getElementById('submissionModal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            this.resetSubmissionForm();
        }
    }

    openEditModal(chronicle) {
        this.isEditMode = true;
        this.currentChronicleId = chronicle._id;

        // Populate form fields
        document.getElementById('editChronicleId').value = chronicle._id;
        document.getElementById('editTitle').value = chronicle.title;
        document.getElementById('editContent').value = chronicle.content;
        
        // Format date for input
        const eventDate = new Date(chronicle.eventDate);
        const formattedDate = eventDate.toISOString().split('T')[0];
        document.getElementById('editEventDate').value = formattedDate;
        
        document.getElementById('editSources').value = chronicle.sources ? chronicle.sources.join('\n') : '';

        const modal = document.getElementById('editModal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            this.isEditMode = false;
            this.currentChronicleId = null;
        }
    }

    resetSubmissionForm() {
        const form = document.getElementById('submissionForm');
        if (form) {
            form.reset();
        }
    }

    async handleSubmission(e) {
        e.preventDefault();

        if (!window.authManager || !window.authManager.isLoggedIn()) {
            alert('Please log in to submit a chronicle.');
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        
        const data = {
            title: formData.get('title')?.trim(),
            content: formData.get('content')?.trim(),
            eventDate: formData.get('eventDate'),
            sources: formData.get('sources')?.trim()
        };

        // Validate required fields
        if (!data.title) {
            this.showFormError(form, 'chronicleTitle', 'Chronicle title is required.');
            return;
        }

        if (!data.content) {
            this.showFormError(form, 'chronicleContent', 'Chronicle content is required.');
            return;
        }

        if (!data.eventDate) {
            this.showFormError(form, 'eventDate', 'Event date is required.');
            return;
        }

        // Validate date is not in the future
        const eventDateObj = new Date(data.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for proper comparison
        
        if (eventDateObj > today) {
            this.showFormError(form, 'eventDate', 'Event date cannot be in the future.');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Immortalizing...';

            const response = await window.apiClient.post('/chronicles', data);
            
            // Success
            this.showSuccess('Chronicle immortalized successfully!');
            this.closeSubmissionModal();
            
            // Refresh the feed
            if (window.chroniclesFeed) {
                window.chroniclesFeed.refresh();
            }

        } catch (error) {
            console.error('Error submitting chronicle:', error);
            let errorMessage = 'Failed to submit chronicle. Please try again.';
            
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            
            this.showFormError(form, null, errorMessage);
        } finally {
            // Re-enable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-scroll"></i> Immortalize Chronicle';
            }
        }
    }

    async handleEdit(e) {
        e.preventDefault();

        if (!this.currentChronicleId) {
            alert('Error: No chronicle ID found.');
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        
        const data = {
            title: formData.get('title')?.trim(),
            content: formData.get('content')?.trim(),
            eventDate: formData.get('eventDate'),
            sources: formData.get('sources')?.trim()
        };

        // Validate required fields
        if (!data.title) {
            this.showFormError(form, 'editTitle', 'Chronicle title is required.');
            return;
        }

        if (!data.content) {
            this.showFormError(form, 'editContent', 'Chronicle content is required.');
            return;
        }

        if (!data.eventDate) {
            this.showFormError(form, 'editEventDate', 'Event date is required.');
            return;
        }

        // Validate date is not in the future
        const eventDateObj = new Date(data.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDateObj > today) {
            this.showFormError(form, 'editEventDate', 'Event date cannot be in the future.');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            const response = await window.apiClient.put(`/chronicles/${this.currentChronicleId}`, data);
            
            // Success
            this.showSuccess('Chronicle updated successfully!');
            this.closeEditModal();
            
            // Refresh the feed
            if (window.chroniclesFeed) {
                window.chroniclesFeed.refresh();
            }

        } catch (error) {
            console.error('Error updating chronicle:', error);
            let errorMessage = 'Failed to update chronicle. Please try again.';
            
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            
            this.showFormError(form, null, errorMessage);
        } finally {
            // Re-enable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }
        }
    }

    async handleDelete() {
        if (!this.currentChronicleId) {
            alert('Error: No chronicle ID found.');
            return;
        }

        const confirmed = confirm('Are you sure you want to delete this chronicle? This action cannot be undone.');
        if (!confirmed) return;

        try {
            await window.apiClient.delete(`/chronicles/${this.currentChronicleId}`);
            
            this.showSuccess('Chronicle deleted successfully.');
            this.closeEditModal();
            
            // Refresh the feed
            if (window.chroniclesFeed) {
                window.chroniclesFeed.refresh();
            }

        } catch (error) {
            console.error('Error deleting chronicle:', error);
            let errorMessage = 'Failed to delete chronicle. Please try again.';
            
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            
            alert(errorMessage);
        }
    }

    showFormError(form, fieldId, message) {
        // Remove any existing error messages
        const existingErrors = form.querySelectorAll('.field-error');
        existingErrors.forEach(error => error.remove());

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: var(--error);
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid var(--error);
            padding: 0.8rem;
            border-radius: 8px;
            margin-top: 1rem;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

        // Add error to form
        if (fieldId) {
            const field = document.getElementById(fieldId);
            if (field) {
                const formGroup = field.closest('.form-group');
                if (formGroup) {
                    formGroup.appendChild(errorElement);
                    field.focus();
                    return;
                }
            }
        }
        
        // Fallback: add error at the end of the form
        const modalActions = form.querySelector('.modal-actions');
        if (modalActions) {
            form.insertBefore(errorElement, modalActions);
        } else {
            form.appendChild(errorElement);
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
        const submissionStyle = document.createElement('style');
        submissionStyle.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(submissionStyle);

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
    window.SubmissionModal = SubmissionModal;
}
