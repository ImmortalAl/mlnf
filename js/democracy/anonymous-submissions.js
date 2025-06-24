// Anonymous Submissions System
// Handles anonymous content submission for designated sections

class AnonymousSubmissionSystem {
    constructor() {
        this.currentSection = null;
        this.fingerprintData = null;
        this.init();
    }

    init() {
        this.generateFingerprint();
        this.setupEventListeners();
    }

    generateFingerprint() {
        // Create a semi-anonymous fingerprint for rate limiting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Anonymous submission fingerprint', 2, 2);
        
        const fingerprint = canvas.toDataURL();
        this.fingerprintData = btoa(fingerprint.substring(0, 100));
    }

    setupEventListeners() {
        // Listen for section changes to show/hide anonymous form
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-category]')) {
                const category = e.target.getAttribute('data-category');
                this.handleSectionChange(category);
            }
        });

        // Handle anonymous submission toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('#toggleAnonymousMode') || e.target.matches('#threadAnonymousMode')) {
                this.toggleAnonymousMode();
            }
        });

        // Listen for category changes in thread composer
        document.addEventListener('change', (e) => {
            if (e.target.matches('#threadCategory')) {
                this.handleComposerCategoryChange(e.target.value);
            }
        });
    }

    async handleSectionChange(category) {
        // Check if current section allows anonymous submissions
        try {
            const response = await fetch('/api/anonymous/sections');
            const data = await response.json();
            
            if (data.success) {
                const section = data.sections.find(s => s.category === category);
                if (section && section.allowsAnonymous) {
                    this.currentSection = section;
                    this.showAnonymousOption();
                } else {
                    this.hideAnonymousOption();
                }
            }
        } catch (error) {
            console.error('Error checking section permissions:', error);
        }
    }

    showAnonymousOption() {
        const composerAnonymous = document.getElementById('threadComposerAnonymous');
        if (composerAnonymous) {
            composerAnonymous.style.display = 'block';
        }
    }

    hideAnonymousOption() {
        const composerAnonymous = document.getElementById('threadComposerAnonymous');
        if (composerAnonymous) {
            composerAnonymous.style.display = 'none';
            // Reset checkbox
            const checkbox = document.getElementById('threadAnonymousMode');
            if (checkbox) checkbox.checked = false;
        }
    }

    handleComposerCategoryChange(category) {
        // Check if current category allows anonymous submissions
        this.handleSectionChange(category);
    }

    toggleAnonymousMode() {
        const checkbox = document.getElementById('toggleAnonymousMode');
        
        if (checkbox.checked) {
            this.showAnonymousPreview();
        } else {
            this.hideAnonymousPreview();
        }
    }

    showAnonymousPreview() {
        const authorContainer = document.querySelector('.thread-author-preview');
        if (authorContainer) {
            authorContainer.innerHTML = `
                <div class="anonymous-author-preview">
                    <i class="fas fa-mask" style="color: var(--accent-gold);"></i>
                    <span>Anonymous Contributor</span>
                </div>
            `;
        }
    }

    hideAnonymousPreview() {
        const authorContainer = document.querySelector('.thread-author-preview');
        if (authorContainer && window.authManager.isLoggedIn()) {
            const user = window.authManager.getUser();
            if (user) {
                authorContainer.innerHTML = `
                    <div class="registered-author-preview">
                        <i class="fas fa-user-circle"></i>
                        <span>${user.username}</span>
                    </div>
                `;
            }
        }
    }

    async submitAnonymousContent(title, content) {
        if (!this.currentSection) {
            throw new Error('No anonymous section selected');
        }

        try {
            const response = await fetch('/api/anonymous/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sectionId: this.currentSection.id,
                    title: title,
                    content: content,
                    displayName: this.generateAnonymousName(),
                    fingerprint: this.fingerprintData
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Anonymous submission posted successfully!', 'success');
                return data.submission;
            } else {
                throw new Error(data.error || 'Failed to submit anonymously');
            }
        } catch (error) {
            console.error('Error submitting anonymous content:', error);
            throw error;
        }
    }

    generateAnonymousName() {
        const adjectives = [
            'Eternal', 'Mystic', 'Ancient', 'Wise', 'Noble', 'Silent', 'Hidden',
            'Timeless', 'Immortal', 'Celestial', 'Profound', 'Sacred', 'Enigmatic'
        ];
        
        const nouns = [
            'Seeker', 'Scholar', 'Wanderer', 'Guardian', 'Sage', 'Observer',
            'Keeper', 'Whisper', 'Soul', 'Spirit', 'Flame', 'Shadow', 'Star'
        ];

        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${adjective} ${noun}`;
    }

    displayAnonymousSubmissions(submissions) {
        const threadList = document.getElementById('threadList');
        if (!threadList) return;

        submissions.forEach(submission => {
            const element = this.createAnonymousElement(submission);
            threadList.appendChild(element);
        });
    }

    createAnonymousElement(submission) {
        const div = document.createElement('div');
        div.className = 'thread anonymous-submission';
        div.innerHTML = `
            <div class="anonymous-header">
                <div class="anonymous-name">
                    <i class="fas fa-mask"></i>
                    ${submission.displayName}
                </div>
                <div class="anonymous-timestamp">
                    ${new Date(submission.createdAt).toLocaleDateString()}
                </div>
            </div>
            
            <div class="anonymous-content">
                ${submission.content}
            </div>
            
            <div class="anonymous-actions">
                <button class="btn btn-sm btn-secondary" onclick="anonymousSystem.flagContent('${submission._id}')">
                    <i class="fas fa-flag"></i> Flag
                </button>
            </div>
        `;
        
        return div;
    }

    async flagContent(submissionId) {
        try {
            const reason = prompt('Reason for flagging (optional):');
            if (reason === null) return; // User cancelled

            const response = await fetch(`/api/anonymous/flag/${submissionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Content flagged for review', 'info');
            } else {
                this.showNotification(data.error || 'Failed to flag content', 'error');
            }
        } catch (error) {
            console.error('Error flagging content:', error);
            this.showNotification('Error flagging content', 'error');
        }
    }

    showNotification(message, type = 'info') {
        if (window.governanceSystem) {
            window.governanceSystem.showNotification(message, type);
        }
    }

    // Integrate with existing thread submission
    isAnonymousMode() {
        const checkbox = document.getElementById('threadAnonymousMode') || document.getElementById('toggleAnonymousMode');
        return checkbox && checkbox.checked;
    }

    async handleThreadSubmission(title, content) {
        if (this.isAnonymousMode() && this.currentSection) {
            return await this.submitAnonymousContent(title, content);
        }
        return null; // Let normal submission process handle it
    }
}

// Initialize system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.anonymousSystem = new AnonymousSubmissionSystem();
});

// CSS for anonymous submissions (to be added to democracy.css)
const anonymousCSS = `
.anonymous-toggle {
    background: var(--surface-secondary);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
}

.toggle-slider {
    position: relative;
    width: 50px;
    height: 24px;
    background: var(--surface-tertiary);
    border-radius: 12px;
    transition: background 0.3s ease;
}

.toggle-slider::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
}

input[type="checkbox"]:checked + .toggle-slider {
    background: var(--accent-gold);
}

input[type="checkbox"]:checked + .toggle-slider::after {
    transform: translateX(26px);
}

input[type="checkbox"] {
    display: none;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
}

.anonymous-info {
    margin-top: 0.5rem;
    color: var(--text-secondary);
}

.anonymous-author-preview {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--accent-gold);
    font-style: italic;
}

.anonymous-submission {
    border-left: 4px solid var(--accent-gold);
}

.anonymous-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.anonymous-name {
    font-weight: 500;
    color: var(--accent-gold);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = anonymousCSS;
document.head.appendChild(style); 