// Anonymous Submissions System
// Handles anonymous content submission for designated sections

class AnonymousSubmissions {
    constructor() {
        this.anonymousSections = [];
        this.fingerprintData = null;
    }

    async init() {
        this.generateFingerprint();
        await this.loadAnonymousSections();
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

    async loadAnonymousSections() {
        try {
            const data = await window.apiClient.get('/anonymous/sections');
            
            if (data.success) {
                this.anonymousSections = data.sections;
            }
        } catch (error) {
            console.error('[Anonymous] Error loading sections:', error);
        }
    }

    setupEventListeners() {
        
        // Listen for category changes in thread composer
        const categorySelect = document.querySelector('#threadForm select[name="category"]');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this.updateAnonymousToggleVisibility();
            });
        }
    }

    updateAnonymousToggleVisibility() {
        const categorySelect = document.querySelector('#threadForm select[name="category"]');
        const anonymousContainer = document.getElementById('threadComposerAnonymous');
        
        if (!categorySelect || !anonymousContainer) {
            return;
        }

        const selectedCategory = categorySelect.value;
        
        // For the unified messageboard system, allow anonymous posting in specific categories
        const allowsAnonymous = ['Anonymous Whispers', 'Debates', 'Ideas'].includes(selectedCategory);


        if (allowsAnonymous) {
            anonymousContainer.style.display = 'block';
            this.showAnonymousPreview();
        } else {
            anonymousContainer.style.display = 'none';
            // Reset checkbox when hiding
            const checkbox = document.getElementById('anonymousToggle');
            if (checkbox) {
                checkbox.checked = false;
            }
        }
    }

    showAnonymousPreview() {
        const checkbox = document.getElementById('anonymousToggle');
        const anonymousContainer = document.getElementById('threadComposerAnonymous');
        
        if (!checkbox || !anonymousContainer) return;

        // Add preview for anonymous name
        let previewElement = anonymousContainer.querySelector('.anonymous-preview');
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'anonymous-preview';
            anonymousContainer.appendChild(previewElement);
        }

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                const anonymousName = this.generateAnonymousName();
                previewElement.innerHTML = `
                    <div class="anonymous-author-preview">
                        <i class="fas fa-mask"></i>
                        <span>You will appear as: <strong>${anonymousName}</strong></span>
                    </div>
                `;
                previewElement.style.display = 'block';
            } else {
                previewElement.style.display = 'none';
            }
        });
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

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Make it available globally
window.AnonymousSubmissions = AnonymousSubmissions;

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
const anonymousStyle = document.createElement('style');
anonymousStyle.textContent = anonymousCSS;
document.head.appendChild(anonymousStyle); 