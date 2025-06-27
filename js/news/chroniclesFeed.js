// Chronicles Feed - Displays and manages the list of chronicles/news
class ChroniclesFeed {
    constructor() {
        this.currentPage = 1;
        this.currentView = 'recent';
        this.currentSort = 'submission';
        this.chronicles = [];
        this.totalPages = 1;
        this.loading = false;
        this.hasMore = true;
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
                const sort = e.target.dataset.sort;
                this.switchView(view, sort);
            });
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('load-more-btn')) {
                this.loadMoreChronicles();
            }
        });

        // Chronicle card clicks - open detail modal
        document.addEventListener('click', (e) => {
            const chronicleCard = e.target.closest('.chronicle-card');
            if (chronicleCard && !e.target.closest('.action-btn')) {
                const chronicleId = chronicleCard.dataset.id;
                this.openChronicleModal(chronicleId);
            }
        });
    }

    switchView(view, sort) {
        this.currentView = view;
        this.currentSort = sort;
        this.currentPage = 1;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.loadChronicles();
    }

    async loadChronicles() {
        if (this.loading) return;
        
        this.loading = true;
        try {
            const sortParam = this.currentSort === 'event' ? 'eventDate' : 'createdAt';
            const response = await window.apiClient.get(`/chronicles?page=${this.currentPage}&limit=15&sort=${sortParam}`);
            
            if (this.currentPage === 1) {
                this.chronicles = response.docs;
            } else {
                this.chronicles.push(...response.docs);
            }
            
            this.totalPages = response.totalPages;
            this.hasMore = this.currentPage < this.totalPages;
            this.renderChronicles();
        } catch (error) {
            console.error('Error loading chronicles:', error);
            this.showError('Failed to load chronicles. Please try again.');
        } finally {
            this.loading = false;
        }
    }

    async loadMoreChronicles() {
        if (!this.hasMore || this.loading) return;
        
        this.currentPage++;
        await this.loadChronicles();
    }

    renderChronicles() {
        const feed = document.getElementById('chroniclesFeed');
        if (!feed) return;

        if (this.chronicles.length === 0) {
            feed.innerHTML = '<div class="no-chronicles">No chronicles found. Be the first to submit an eternal truth!</div>';
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
        const eventDate = new Date(chronicle.eventDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const submissionDate = new Date(chronicle.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const isAuthor = window.authManager && window.authManager.getUser() && 
                        window.authManager.getUser()._id === chronicle.author._id;

        // Create excerpt from content
        const excerpt = chronicle.content.length > 300 
            ? chronicle.content.substring(0, 300) + '...' 
            : chronicle.content;

        return `
            <article class="chronicle-card" data-id="${chronicle._id}">
                <div class="chronicle-header">
                    <h3 class="chronicle-title">${this.escapeHtml(chronicle.title)}</h3>
                    <div class="chronicle-meta">
                        <div class="chronicle-author-info">
                            <!-- MLNF Avatar System will populate this -->
                        </div>
                        <div class="chronicle-dates">
                            <div class="event-date">
                                <i class="fas fa-calendar-alt"></i>
                                ${eventDate}
                            </div>
                            <div class="submission-date">
                                <i class="fas fa-clock"></i>
                                ${submissionDate}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="chronicle-content">
                    <div class="chronicle-excerpt">
                        ${this.formatContent(excerpt)}
                    </div>
                </div>
                
                ${chronicle.sources && chronicle.sources.length > 0 ? `
                    <div class="chronicle-sources">
                        <h4><i class="fas fa-link"></i> Sources & References</h4>
                        <ul>
                            ${chronicle.sources.slice(0, 3).map(source => 
                                `<li><a href="${source}" target="_blank" rel="noopener">${this.truncateUrl(source)}</a></li>`
                            ).join('')}
                            ${chronicle.sources.length > 3 ? `<li>... and ${chronicle.sources.length - 3} more</li>` : ''}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="chronicle-actions">
                    <div class="voting-actions">
                        <button class="action-btn consecrate" data-id="${chronicle._id}" data-action="consecrate" 
                                title="Consecrate this chronicle as eternal truth">
                            <i class="fas fa-certificate"></i>
                            <span>Consecrate</span>
                        <span class="count">(${chronicle.validations ? chronicle.validations.length : 0})</span>
                    </button>
                        <button class="action-btn investigate" data-id="${chronicle._id}" data-action="investigate"
                                title="Investigate this chronicle for accuracy">
                            <i class="fas fa-search"></i>
                            <span>Investigate</span>
                        <span class="count">(${chronicle.challenges ? chronicle.challenges.length : 0})</span>
                    </button>
                    </div>
                    
                    <div class="chronicle-management">
                        ${isAuthor ? `
                            <button class="action-btn edit" data-id="${chronicle._id}" data-action="edit" title="Edit this chronicle">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        ` : ''}
                        <button class="action-btn comments" data-id="${chronicle._id}" data-action="comments" title="View comments">
                            <i class="fas fa-comments"></i> Comments
                    </button>
                    </div>
                </div>
            </article>
        `;
    }

    attachChronicleEvents() {
        // Action button clicks
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const action = e.target.closest('.action-btn').dataset.action;
                const id = e.target.closest('.action-btn').dataset.id;
                
                switch(action) {
                    case 'consecrate':
                        this.consecrateChronicle(id);
                        break;
                    case 'investigate':
                        this.investigateChronicle(id);
                        break;
                    case 'edit':
                this.editChronicle(id);
                        break;
                    case 'comments':
                        this.openComments(id);
                        break;
                }
            });
        });

        // Populate avatar systems for chronicle author info
        this.populateChronicleAvatars();
    }

    populateChronicleAvatars() {
        const authorContainers = document.querySelectorAll('.chronicle-author-info');
        authorContainers.forEach((container, index) => {
            if (this.chronicles[index] && this.chronicles[index].author) {
                const author = this.chronicles[index].author;
                
                if (window.MLNFAvatars) {
                    const avatarElement = window.MLNFAvatars.createUserDisplay({
                        username: author.username || author.displayName || 'Anonymous',
                        title: author.title || 'Eternal Soul',
                        status: author.status || null,
                        avatarSize: 'sm',
                        displaySize: 'sm',
                        mystical: author.role === 'admin' || author.isVIP,
                        online: author.online,
                        customAvatar: author.avatar,
                        usernameStyle: 'immortal'
                    });
                    container.innerHTML = '';
                    container.appendChild(avatarElement);
                } else {
                    console.warn('[Chronicles] MLNFAvatars not available, creating fallback');
                    // Fallback if avatar system not loaded
                    container.innerHTML = `
                        <div class="fallback-author">
                            <div class="fallback-avatar">${(author.username || 'A')[0].toUpperCase()}</div>
                            <span class="fallback-name">${author.username || author.displayName || 'Anonymous'}</span>
                        </div>
                    `;
                }
            }
        });
    }

    async openChronicleModal(chronicleId) {
        
        try {
            // Verify modal exists
            const modal = document.getElementById('chronicleModal');
            if (!modal) {
                console.error('[ChroniclesFeed] Chronicle modal element not found');
                this.showError('Chronicle modal not available.');
                return;
            }

            // Get full chronicle details
            const response = await window.apiClient.get(`/chronicles/${chronicleId}`);
            const chronicle = response;

            // Populate modal
            this.populateChronicleModal(chronicle);
            
            // Show modal
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('[ChroniclesFeed] Error loading chronicle details:', error);
            this.showError('Failed to load chronicle details: ' + error.message);
        }
    }

    populateChronicleModal(chronicle) {
        // Title
        const titleElement = document.getElementById('modalChronicleTitle');
        if (titleElement) titleElement.textContent = chronicle.title;

        // Dates
        const eventDateElement = document.getElementById('modalEventDate');
        const submissionDateElement = document.getElementById('modalSubmissionDate');
        
        if (eventDateElement) {
            eventDateElement.textContent = new Date(chronicle.eventDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (submissionDateElement) {
            submissionDateElement.textContent = new Date(chronicle.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Content
        const contentElement = document.getElementById('modalChronicleContent');
        if (contentElement) {
            contentElement.innerHTML = this.formatContent(chronicle.content);
        }

        // Sources
        const sourcesContainer = document.getElementById('modalChronicleSourcesContainer');
        const sourcesList = document.getElementById('modalChronicleSourcesList');
        
        if (chronicle.sources && chronicle.sources.length > 0) {
            sourcesContainer.style.display = 'block';
            sourcesList.innerHTML = chronicle.sources.map(source => 
                `<li><a href="${source}" target="_blank" rel="noopener">${source}</a></li>`
            ).join('');
        } else {
            sourcesContainer.style.display = 'none';
        }

        // Voting counts
        const consecrateCount = document.getElementById('modalConsecrateCount');
        const investigateCount = document.getElementById('modalInvestigateCount');
        
        if (consecrateCount) consecrateCount.textContent = `(${chronicle.validations ? chronicle.validations.length : 0})`;
        if (investigateCount) investigateCount.textContent = `(${chronicle.challenges ? chronicle.challenges.length : 0})`;

        // Edit button visibility
        const editBtn = document.getElementById('modalEditBtn');
        const isAuthor = window.authManager && window.authManager.getUser() && 
                        window.authManager.getUser()._id === chronicle.author._id;
        
        if (editBtn) {
            editBtn.style.display = isAuthor ? 'block' : 'none';
            editBtn.dataset.id = chronicle._id;
        }

        // Set up modal action buttons
        const consecrateBtn = document.getElementById('modalConsecrateBtn');
        const investigateBtn = document.getElementById('modalInvestigateBtn');
        const commentsBtn = document.getElementById('modalCommentsBtn');

        if (consecrateBtn) consecrateBtn.dataset.id = chronicle._id;
        if (investigateBtn) investigateBtn.dataset.id = chronicle._id;
        if (commentsBtn) commentsBtn.dataset.id = chronicle._id;

        // Populate author avatar
        const authorContainer = document.querySelector('.chronicle-detail .chronicle-author-info');
        if (authorContainer && chronicle.author) {
            
            if (window.MLNFAvatars) {
                const avatarElement = window.MLNFAvatars.createUserDisplay({
                    username: chronicle.author.username || chronicle.author.displayName || 'Anonymous',
                    title: chronicle.author.title || 'Eternal Soul',
                    status: chronicle.author.status || null,
                    avatarSize: 'md',
                    displaySize: 'md',
                    mystical: chronicle.author.role === 'admin' || chronicle.author.isVIP,
                    online: chronicle.author.online,
                    customAvatar: chronicle.author.avatar,
                    usernameStyle: 'immortal'
                });
                authorContainer.innerHTML = '';
                authorContainer.appendChild(avatarElement);
            } else {
                console.warn('[Chronicles Modal] MLNFAvatars not available, creating fallback');
                // Fallback if avatar system not loaded
                authorContainer.innerHTML = `
                    <div class="fallback-author">
                        <div class="fallback-avatar">${(chronicle.author.username || 'A')[0].toUpperCase()}</div>
                        <span class="fallback-name">${chronicle.author.username || chronicle.author.displayName || 'Anonymous'}</span>
                    </div>
                `;
            }
        }

        // Set up modal event listeners
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Close modal
        const closeBtn = document.getElementById('closeChronicleModal');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeChronicleModal();
        }

        // Modal action buttons
        const modalActions = ['modalConsecrateBtn', 'modalInvestigateBtn', 'modalEditBtn', 'modalCommentsBtn'];
        modalActions.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.onclick = (e) => {
                    const chronicleId = btn.dataset.id;
                    switch(btnId) {
                        case 'modalConsecrateBtn':
                            this.consecrateChronicle(chronicleId);
                            break;
                        case 'modalInvestigateBtn':
                            this.investigateChronicle(chronicleId);
                            break;
                        case 'modalEditBtn':
                            this.editChronicle(chronicleId);
                            break;
                        case 'modalCommentsBtn':
                            this.openComments(chronicleId);
                            break;
                    }
                };
            }
        });

        // Close modal on background click
        const modal = document.getElementById('chronicleModal');
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeChronicleModal();
                }
            };
        }
    }

    closeChronicleModal() {
        const modal = document.getElementById('chronicleModal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    editChronicle(id) {
        const chronicle = this.chronicles.find(c => c._id === id);
        if (chronicle && window.submissionModal) {
            this.closeChronicleModal(); // Close detail modal first
            window.submissionModal.openEditModal(chronicle);
        }
    }

    async consecrateChronicle(id) {
        try {
            const response = await window.apiClient.post(`/chronicles/${id}/validate`);
            this.updateVotingUI(id, 'consecrate', response);
        } catch (error) {
            console.error('Error consecrating chronicle:', error);
            this.showError('Failed to consecrate chronicle.');
        }
    }

    async investigateChronicle(id) {
        try {
            const response = await window.apiClient.post(`/chronicles/${id}/challenge`);
            this.updateVotingUI(id, 'investigate', response);
        } catch (error) {
            console.error('Error investigating chronicle:', error);
            this.showError('Failed to investigate chronicle.');
        }
    }

    updateVotingUI(chronicleId, action, response) {
        // Update card buttons
        const cardConsecrateBtn = document.querySelector(`.chronicle-card[data-id="${chronicleId}"] .action-btn.consecrate .count`);
        const cardInvestigateBtn = document.querySelector(`.chronicle-card[data-id="${chronicleId}"] .action-btn.investigate .count`);
        
        if (cardConsecrateBtn) cardConsecrateBtn.textContent = `(${response.validations})`;
        if (cardInvestigateBtn) cardInvestigateBtn.textContent = `(${response.challenges})`;

        // Update modal buttons if modal is open
        const modalConsecrateCount = document.getElementById('modalConsecrateCount');
        const modalInvestigateCount = document.getElementById('modalInvestigateCount');
        
        if (modalConsecrateCount) modalConsecrateCount.textContent = `(${response.validations})`;
        if (modalInvestigateCount) modalInvestigateCount.textContent = `(${response.challenges})`;

        // Update active states
        const cardConsecrateButton = document.querySelector(`.chronicle-card[data-id="${chronicleId}"] .action-btn.consecrate`);
        const cardInvestigateButton = document.querySelector(`.chronicle-card[data-id="${chronicleId}"] .action-btn.investigate`);
        const modalConsecrateButton = document.getElementById('modalConsecrateBtn');
        const modalInvestigateButton = document.getElementById('modalInvestigateBtn');

        // Remove all active states first
        [cardConsecrateButton, cardInvestigateButton, modalConsecrateButton, modalInvestigateButton].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        // Add active state based on user's current vote
        if (response.userValidated) {
            if (cardConsecrateButton) cardConsecrateButton.classList.add('active');
            if (modalConsecrateButton) modalConsecrateButton.classList.add('active');
        }
        
        if (response.userChallenged) {
            if (cardInvestigateButton) cardInvestigateButton.classList.add('active');
            if (modalInvestigateButton) modalInvestigateButton.classList.add('active');
        }
    }

    openComments(id) {
        if (window.CommentsSystem) {
            window.CommentsSystem.openComments('news', id);
        } else {
            console.error('Comments system not available');
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

    truncateUrl(url) {
        if (url.length > 50) {
            return url.substring(0, 47) + '...';
        }
        return url;
    }

    showError(message) {
        const feed = document.getElementById('chroniclesFeed');
        if (feed) {
            feed.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    refresh() {
        this.currentPage = 1;
        this.loadChronicles();
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
window.ChroniclesFeed = ChroniclesFeed;
}
