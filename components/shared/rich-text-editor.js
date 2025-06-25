// MLNF Shared Rich Text Editor Component
// Based on Quill.js implementation from lander.html
// Usage: const editor = new MLNFRichTextEditor(containerId, options);

class MLNFRichTextEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.quill = null;
        this.options = {
            theme: 'snow',
            placeholder: 'Share your eternal thoughts...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            ...options
        };
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error(`MLNF Rich Text Editor: Container #${this.containerId} not found`);
            return;
        }
        
        // Ensure Quill.js is loaded
        if (typeof Quill === 'undefined') {
            console.error('MLNF Rich Text Editor: Quill.js not loaded');
            return;
        }
        
        // Create editor container if not exists
        if (!this.container.querySelector('.quill-editor')) {
            this.container.innerHTML = `
                <div class="mlnf-rich-editor-container">
                    <div class="quill-editor"></div>
                </div>
            `;
        }
        
        // Initialize Quill editor
        this.quill = new Quill(this.container.querySelector('.quill-editor'), this.options);
        
        // Apply custom styling
        this.applyCustomStyling();
        
    }
    
    applyCustomStyling() {
        const toolbar = this.container.querySelector('.ql-toolbar');
        const editor = this.container.querySelector('.ql-editor');
        const container = this.container.querySelector('.ql-container');
        
        if (toolbar) {
            toolbar.style.cssText = `
                background: linear-gradient(135deg, rgba(26, 26, 51, 0.95), rgba(42, 64, 102, 0.9));
                border: 2px solid rgba(255, 94, 120, 0.3);
                border-bottom: 1px solid rgba(255, 94, 120, 0.2);
                border-radius: 12px 12px 0 0;
                color: var(--text);
            `;
        }
        
        if (container) {
            container.style.cssText = `
                background: linear-gradient(135deg, rgba(13, 13, 26, 0.95), rgba(26, 26, 51, 0.9));
                border: 2px solid rgba(255, 94, 120, 0.3);
                border-top: none;
                border-radius: 0 0 12px 12px;
                font-family: 'Segoe UI', system-ui, sans-serif;
            `;
        }
        
        if (editor) {
            editor.style.cssText = `
                color: var(--text);
                min-height: 150px;
                font-size: 1rem;
                line-height: 1.6;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            `;
        }
        
        // Style toolbar buttons
        const buttons = this.container.querySelectorAll('.ql-toolbar button, .ql-toolbar .ql-picker');
        buttons.forEach(button => {
            button.style.cssText = `
                color: var(--text-secondary);
                transition: all 0.2s ease;
            `;
        });
    }
    
    // Public methods for content management
    getContent() {
        return this.quill ? this.quill.root.innerHTML : '';
    }
    
    setContent(html) {
        if (this.quill) {
            this.quill.root.innerHTML = html || '';
        }
    }
    
    getText() {
        return this.quill ? this.quill.getText() : '';
    }
    
    clear() {
        if (this.quill) {
            this.quill.setText('');
        }
    }
    
    focus() {
        if (this.quill) {
            this.quill.focus();
        }
    }
    
    enable(enabled = true) {
        if (this.quill) {
            this.quill.enable(enabled);
        }
    }
    
    disable() {
        this.enable(false);
    }
    
    // Event handling
    on(event, handler) {
        if (this.quill) {
            this.quill.on(event, handler);
        }
    }
    
    off(event, handler) {
        if (this.quill) {
            this.quill.off(event, handler);
        }
    }
    
    // Destroy editor
    destroy() {
        if (this.quill) {
            // Remove event listeners
            this.quill = null;
            
            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    }
}

// Export for use across the site
window.MLNFRichTextEditor = MLNFRichTextEditor;