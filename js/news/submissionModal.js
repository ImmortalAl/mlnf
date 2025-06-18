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
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeSubmissionModal() {
        const modal = document.getElementById('submissionModal');
        if (modal) {
            modal.style.display = 'none';
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
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
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
            title: formData.get('title'),
            content: formData.get('content'),
            eventDate: formData.get('eventDate'),
            sources: formData.get('sources')
        };

        // Validate required fields
        if (!data.title || !data.content || !data.eventDate) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const response = await window.apiClient.post('/chronicles', data);
            
            // Success
            alert('Chronicle submitted successfully!');
            this.closeSubmissionModal();
            
            // Refresh the feed
            if (window.chroniclesFeed) {
                window.chroniclesFeed.refresh();
            }

        } catch (error) {
            console.error('Error submitting chronicle:', error);
            alert('Failed to submit chronicle. Please try again.');
        } finally {
            // Re-enable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
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
            title: formData.get('title'),
            content: formData.get('content'),
            eventDate: formData.get('eventDate'),
            sources: formData.get('sources')
        };

        // Validate required fields
        if (!data.title || !data.content || !data.eventDate) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            const response = await window.apiClient.put(`/chronicles/${this.currentChronicleId}`, data);
            
            // Success
            alert('Chronicle updated successfully!');
            this.closeEditModal();
            
            // Refresh the feed
            if (window.chroniclesFeed) {
                window.chroniclesFeed.refresh();
            }

        } catch (error) {
            console.error('Error updating chronicle:', error);
            alert('Failed to update chronicle. Please try again.');
        } finally {
            // Re-enable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async handleDelete() {
        if (!this.currentChronicleId) {
            alert('Error: No chronicle ID found.');
            return;
        }

        if (!confirm('Are you sure you want to delete this chronicle? This action cannot be undone.')) {
            return;
        }

        try {
            await window.apiClient.delete(`/chronicles/${this.currentChronicleId}`);
            
            // Success
            alert('Chronicle deleted successfully!');
            this.closeEditModal();
            
            // Refresh the feed
            if (window.chroniclesFeed) {
                window.chroniclesFeed.refresh();
            }

        } catch (error) {
            console.error('Error deleting chronicle:', error);
            alert('Failed to delete chronicle. Please try again.');
        }
    }
}

// Make it globally available
window.SubmissionModal = SubmissionModal;
