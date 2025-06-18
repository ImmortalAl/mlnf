// Chronicles Feed - Displays and manages the list of chronicles/news
class ChroniclesFeed {
    constructor() {
        this.currentPage = 1;
        this.currentView = 'recent';
        this.chronicles = [];
        this.totalPages = 1;
    }

    static init() {
        window.chroniclesFeed = new ChroniclesFeed();
        window.chroniclesFeed.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.loadChronicles();
    }

    setupEventListeners() {
        // View toggle buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Pagination (if needed)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('load-more-btn')) {
                this.loadMoreChronicles();
            }
        });
    }

    switchView(view) {
        this.currentView = view;
        this.currentPage = 1;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.loadChronicles();
    }

    async loadChronicles() {
        try {
            const endpoint = this.currentView === 'recent' ? '/chronicles' : '/chronicles';
            const response = await window.apiClient.get(`${endpoint}?page=${this.currentPage}&limit=15`);
            
            if (this.currentPage === 1) {
                this.chronicles = response.docs;
            } else {
                this.chronicles.push(...response.docs);
            }
            
            this.totalPages = response.totalPages;
            this.renderChronicles();
        } catch (error) {
            console.error('Error loading chronicles:', error);
            this.showError('Failed to load chronicles. Please try again.');
        }
    }

    async loadMoreChronicles() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.loadChronicles();
        }
    }

    renderChronicles() {
        const feed = document.getElementById('chroniclesFeed');
        if (!feed) return;

        if (this.chronicles.length === 0) {
            feed.innerHTML = '<div class="no-chronicles">No chronicles found. Be the first to submit a truth!</div>';
            return;
        }

        let html = '';
        this.chronicles.forEach(chronicle => {
            html += this.createChronicleCard(chronicle);
        });

        // Add load more button if there are more pages
        if (this.currentPage < this.totalPages) {
            html += '<button class="load-more-btn btn btn-outline" style="display: block; margin: 2rem auto;">Load More Chronicles</button>';
        }

        feed.innerHTML = html;
        this.attachChronicleEvents();
    }

    createChronicleCard(chronicle) {
        const date = new Date(chronicle.eventDate || chronicle.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const isAuthor = window.authManager && window.authManager.getUser() && 
                        window.authManager.getUser()._id === chronicle.author._id;

        return `
            <article class="chronicle-card" data-id="${chronicle._id}">
                <div class="chronicle-header">
                    <h3 class="chronicle-title">${this.escapeHtml(chronicle.title)}</h3>
                    <div class="chronicle-meta">
                        <span class="chronicle-date">${date}</span>
                        <span class="chronicle-author">by ${this.escapeHtml(chronicle.author.displayName || chronicle.author.username)}</span>
                        ${isAuthor ? `<button class="edit-chronicle-btn" data-id="${chronicle._id}"><i class="fas fa-edit"></i></button>` : ''}
                    </div>
                </div>
                <div class="chronicle-content">
                    ${this.formatContent(chronicle.content)}
                </div>
                ${chronicle.sources && chronicle.sources.length > 0 ? `
                    <div class="chronicle-sources">
                        <h4>Sources:</h4>
                        <ul>
                            ${chronicle.sources.map(source => `<li><a href="${source}" target="_blank" rel="noopener">${source}</a></li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="chronicle-actions">
                    <button class="validate-btn" data-id="${chronicle._id}">
                        <i class="fas fa-check"></i> Validate (${chronicle.validations ? chronicle.validations.length : 0})
                    </button>
                    <button class="challenge-btn" data-id="${chronicle._id}">
                        <i class="fas fa-question"></i> Challenge (${chronicle.challenges ? chronicle.challenges.length : 0})
                    </button>
                    <button class="comments-btn" data-id="${chronicle._id}">
                        <i class="fas fa-comments"></i> Comments
                    </button>
                </div>
            </article>
        `;
    }

    attachChronicleEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-chronicle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.editChronicle(id);
            });
        });

        // Validate buttons
        document.querySelectorAll('.validate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.validateChronicle(id);
            });
        });

        // Challenge buttons
        document.querySelectorAll('.challenge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.challengeChronicle(id);
            });
        });

        // Comments buttons
        document.querySelectorAll('.comments-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.openComments(id);
            });
        });
    }

    editChronicle(id) {
        const chronicle = this.chronicles.find(c => c._id === id);
        if (chronicle && window.submissionModal) {
            window.submissionModal.openEditModal(chronicle);
        }
    }

    async validateChronicle(id) {
        try {
            const response = await window.apiClient.post(`/chronicles/${id}/validate`);
            // Update the UI with new validation count
            const button = document.querySelector(`.validate-btn[data-id="${id}"]`);
            if (button) {
                button.innerHTML = `<i class="fas fa-check"></i> Validate (${response.validations})`;
            }
        } catch (error) {
            console.error('Error validating chronicle:', error);
            alert('Failed to validate chronicle. Please try again.');
        }
    }

    async challengeChronicle(id) {
        try {
            const response = await window.apiClient.post(`/chronicles/${id}/challenge`);
            // Update the UI with new challenge count
            const button = document.querySelector(`.challenge-btn[data-id="${id}"]`);
            if (button) {
                button.innerHTML = `<i class="fas fa-question"></i> Challenge (${response.challenges})`;
            }
        } catch (error) {
            console.error('Error challenging chronicle:', error);
            alert('Failed to challenge chronicle. Please try again.');
        }
    }

    openComments(id) {
        if (window.commentsSystem) {
            window.commentsSystem.openComments(id);
        }
    }

    formatContent(content) {
        // Basic formatting - convert line breaks to paragraphs
        return content.split('\n\n').map(paragraph => 
            `<p>${this.escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`
        ).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const feed = document.getElementById('chroniclesFeed');
        if (feed) {
            feed.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    // Public method to refresh the feed (called after new submission)
    refresh() {
        this.currentPage = 1;
        this.loadChronicles();
    }
}

// Make it globally available
window.ChroniclesFeed = ChroniclesFeed;
