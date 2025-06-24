// Democracy 3.0 Governance System
// Integrated with Echoes Unbound Message Board

class GovernanceSystem {
    constructor() {
        this.currentProposals = [];
        this.userVotes = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadActiveProposals();
    }

    setupEventListeners() {
        // Listen for category changes to show/hide governance content
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-category="Governance"]')) {
                this.showGovernanceInterface();
            }
        });
    }

    async loadActiveProposals() {
        try {
            const data = await window.apiClient.get('/governance/proposals?status=active');
            
            if (data.success) {
                this.currentProposals = data.proposals;
                this.displayProposals(data.proposals);
            }
        } catch (error) {
            console.error('Error loading proposals:', error);
        }
    }

    displayProposals(proposals) {
        const threadList = document.getElementById('threadList');
        if (!threadList) return;

        // Clear existing threads when in governance mode
        if (this.isGovernanceMode()) {
            threadList.innerHTML = '';
            
            if (proposals.length === 0) {
                threadList.innerHTML = `
                    <div class="no-proposals">
                        <h3>No Active Proposals</h3>
                        <p>Be the first to propose a community decision!</p>
                        <button class="btn btn-primary" onclick="governanceSystem.showProposalModal()">
                            <i class="fas fa-plus"></i> Create Proposal
                        </button>
                    </div>
                `;
                return;
            }

            proposals.forEach(proposal => {
                const proposalElement = this.createProposalElement(proposal);
                threadList.appendChild(proposalElement);
            });
        }
    }

    createProposalElement(proposal) {
        const div = document.createElement('div');
        div.className = 'thread-item proposal-item';
        div.innerHTML = `
            <div class="proposal-header">
                <h3 class="proposal-title">
                    <i class="fas fa-vote-yea"></i>
                    ${proposal.title}
                </h3>
                <div class="proposal-meta">
                    <span class="proposal-type">${proposal.type}</span>
                    <span class="proposal-status ${proposal.status}">${proposal.status}</span>
                    ${proposal.isVotingActive ? 
                        `<span class="voting-active">
                            <i class="fas fa-clock"></i> 
                            Voting Active
                        </span>` : 
                        `<span class="voting-ended">Voting Ended</span>`
                    }
                </div>
            </div>
            
            <div class="proposal-description">
                ${proposal.description.substring(0, 200)}...
            </div>
            
            <div class="proposal-voting">
                <div class="vote-counts">
                    <div class="vote-count yes">
                        <i class="fas fa-thumbs-up"></i>
                        Yes: ${proposal.yesVotes} (${proposal.percentages.yes}%)
                    </div>
                    <div class="vote-count no">
                        <i class="fas fa-thumbs-down"></i>
                        No: ${proposal.noVotes} (${proposal.percentages.no}%)
                    </div>
                    <div class="vote-count abstain">
                        <i class="fas fa-minus"></i>
                        Abstain: ${proposal.abstainVotes} (${proposal.percentages.abstain}%)
                    </div>
                </div>
                
                <div class="vote-progress">
                    <div class="progress-bar">
                        <div class="progress-yes" style="width: ${proposal.percentages.yes}%"></div>
                        <div class="progress-no" style="width: ${proposal.percentages.no}%"></div>
                        <div class="progress-abstain" style="width: ${proposal.percentages.abstain}%"></div>
                    </div>
                    <div class="total-votes">Total Votes: ${proposal.totalVotes}</div>
                </div>
                
                ${proposal.isVotingActive ? this.createVotingButtons(proposal._id) : ''}
            </div>
            
            <div class="proposal-actions">
                <button class="btn btn-secondary" onclick="governanceSystem.viewProposal('${proposal._id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="btn btn-secondary" onclick="governanceSystem.viewDiscussion('${proposal.discussionThreadId}')">
                    <i class="fas fa-comments"></i> Discussion
                </button>
            </div>
        `;
        
        return div;
    }

    createVotingButtons(proposalId) {
        const userToken = localStorage.getItem('token');
        if (!userToken) {
            return `<div class="login-prompt">
                <p>Please log in to vote on proposals</p>
                <button class="btn btn-primary" onclick="authManager.showModal('login')">Log In</button>
            </div>`;
        }

        return `
            <div class="voting-buttons">
                <button class="btn vote-btn yes" onclick="governanceSystem.castVote('${proposalId}', 'yes')">
                    <i class="fas fa-thumbs-up"></i> Yes
                </button>
                <button class="btn vote-btn no" onclick="governanceSystem.castVote('${proposalId}', 'no')">
                    <i class="fas fa-thumbs-down"></i> No
                </button>
                <button class="btn vote-btn abstain" onclick="governanceSystem.castVote('${proposalId}', 'abstain')">
                    <i class="fas fa-minus"></i> Abstain
                </button>
            </div>
        `;
    }

    async castVote(proposalId, choice) {
        try {
            if (!window.authManager.isLoggedIn()) {
                window.authManager.showModal('login');
                return;
            }

            const data = await window.apiClient.post('/governance/vote', {
                proposalId,
                choice
            });
            
            if (data.success) {
                this.showNotification('Vote cast successfully!', 'success');
                this.loadActiveProposals(); // Refresh to show updated counts
            } else {
                this.showNotification(data.error || 'Failed to cast vote', 'error');
            }
        } catch (error) {
            console.error('Error casting vote:', error);
            this.showNotification('Error casting vote', 'error');
        }
    }

    showProposalModal() {
        const token = localStorage.getItem('token');
        if (!token) {
            authManager.showModal('login');
            return;
        }

        const modalHTML = `
            <div id="proposalModal" class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Proposal</h3>
                        <button class="close-modal" onclick="governanceSystem.closeProposalModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="proposalForm">
                            <div class="form-group">
                                <label for="proposalTitle">Title *</label>
                                <input type="text" id="proposalTitle" name="title" required 
                                       placeholder="Brief, clear description of the proposal">
                            </div>
                            
                            <div class="form-group">
                                <label for="proposalType">Type *</label>
                                <select id="proposalType" name="type" required>
                                    <option value="operational">Operational - Platform features and policies</option>
                                    <option value="moderation">Moderation - Community standards and enforcement</option>
                                    <option value="content_curation">Content Curation - Featured content selection</option>
                                    <option value="constitutional">Constitutional - Fundamental governance changes</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="proposalDescription">Description *</label>
                                <textarea id="proposalDescription" name="description" required rows="6"
                                          placeholder="Detailed explanation of the proposal, its benefits, and implementation"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="votingDuration">Voting Duration</label>
                                <select id="votingDuration" name="votingDuration">
                                    <option value="3">3 days</option>
                                    <option value="7" selected>7 days (recommended)</option>
                                    <option value="14">14 days</option>
                                </select>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-paper-plane"></i> Submit Proposal
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="governanceSystem.closeProposalModal()">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupProposalFormHandlers();
    }

    setupProposalFormHandlers() {
        const form = document.getElementById('proposalForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleProposalSubmission(e));
        }
    }

    async handleProposalSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const proposalData = {
            title: formData.get('title'),
            description: formData.get('description'),
            type: formData.get('type'),
            votingDuration: parseInt(formData.get('votingDuration'))
        };

        try {
            const data = await window.apiClient.post('/governance/propose', proposalData);
            
            if (data.success) {
                this.showNotification('Proposal submitted successfully!', 'success');
                this.closeProposalModal();
                this.loadActiveProposals();
            } else {
                this.showNotification(data.error || 'Failed to submit proposal', 'error');
            }
        } catch (error) {
            console.error('Error submitting proposal:', error);
            this.showNotification('Error submitting proposal', 'error');
        }
    }

    closeProposalModal() {
        const modal = document.getElementById('proposalModal');
        if (modal) {
            modal.remove();
        }
    }

    isGovernanceMode() {
        const activeCategory = document.querySelector('[data-category].active');
        return activeCategory && activeCategory.getAttribute('data-category') === 'Governance';
    }

    showGovernanceInterface() {
        // Update the header for governance mode
        const lyceumHeader = document.querySelector('.lyceum-header-content');
        if (lyceumHeader) {
            lyceumHeader.innerHTML = `
                <h2>Democracy 3.0 - Governance</h2>
                <p>Shape the future of our community through democratic participation</p>
            `;
        }

        // Update the action button
        const actionButton = document.getElementById('newThreadBtn');
        if (actionButton) {
            actionButton.innerHTML = '<i class="fas fa-vote-yea"></i> New Proposal';
            actionButton.onclick = () => this.showProposalModal();
        }

        // Load and display proposals
        this.loadActiveProposals();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                                type === 'error' ? 'fa-exclamation-circle' : 
                                'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize governance system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.governanceSystem = new GovernanceSystem();
});