/**
 * Node Editor Module
 * Handles creating and editing mindmap nodes with rich text content
 */
class NodeEditor {
    constructor() {
        this.quill = null;
        this.currentNode = null;
        this.isEditMode = false;
        this.apiClient = window.apiClient;
        
        this.init();
    }
    
    init() {
        // Initialize Quill editor
        this.quill = new Quill('#node-content-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Share your eternal knowledge...'
        });
        
        // Set up event handlers
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        // Close button
        document.getElementById('closeNodeEditor').addEventListener('click', () => {
            this.close();
        });
        
        // Form submission
        document.getElementById('nodeEditorForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveNode();
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
        
        // Close on background click
        document.getElementById('nodeEditorModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('nodeEditorModal')) {
                this.close();
            }
        });
    }
    
    openForCreate() {
        this.isEditMode = false;
        this.currentNode = null;
        
        // Reset form
        document.getElementById('editorTitle').textContent = 'Create Node';
        document.getElementById('nodeTitleInput').value = '';
        document.getElementById('nodeTagsInput').value = '';
        this.quill.setText('');
        
        // Show modal
        document.getElementById('nodeEditorModal').style.display = 'block';
        
        // Focus title input
        setTimeout(() => {
            document.getElementById('nodeTitleInput').focus();
        }, 100);
    }
    
    openForEdit(nodeData) {
        this.isEditMode = true;
        this.currentNode = nodeData;
        
        // Populate form
        document.getElementById('editorTitle').textContent = 'Edit Node';
        document.getElementById('nodeTitleInput').value = nodeData.title;
        document.getElementById('nodeTagsInput').value = nodeData.tags.join(', ');
        
        // Set content in Quill
        if (nodeData.content.startsWith('<')) {
            // Content is HTML
            this.quill.root.innerHTML = nodeData.content;
        } else {
            // Content is plain text
            this.quill.setText(nodeData.content);
        }
        
        // Show modal
        document.getElementById('nodeEditorModal').style.display = 'block';
        
        // Focus title input
        setTimeout(() => {
            document.getElementById('nodeTitleInput').focus();
        }, 100);
    }
    
    async saveNode() {
        // Get form data
        const title = document.getElementById('nodeTitleInput').value.trim();
        const content = this.quill.root.innerHTML;
        const tagsInput = document.getElementById('nodeTagsInput').value;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        // Validate
        if (!title) {
            this.showError('Please enter a title');
            return;
        }
        
        if (!content || content === '<p><br></p>') {
            this.showError('Please enter some content');
            return;
        }
        
        try {
            let response;
            
            if (this.isEditMode) {
                // Update existing node
                response = await this.apiClient.put(`/mindmap/nodes/${this.currentNode._id}`, {
                    title,
                    content,
                    tags
                });
                
                console.log('Node update response:', response);
                
                if (!response) {
                    this.showError('Malformed response from server (no node object)');
                    return;
                }
                
                // Create updated node data by merging current node with response
                const updatedNodeData = {
                    ...this.currentNode,
                    title,
                    content,
                    tags,
                    ...response
                };
                
                console.log('Updated node data:', updatedNodeData);
                
                // Update node in graph
                const node = window.nexusEngine.cy.getElementById(this.currentNode._id);
                node.data('title', title);
                node.data('content', content);
                node.data('tags', tags);
                
                // Update local data with merged data
                window.nexusEngine.nodes.set(this.currentNode._id, updatedNodeData);
                
                if (window.nexusEngine.selectedNode && window.nexusEngine.selectedNode.id() === this.currentNode._id) {
                    window.nexusEngine.selectNode(node);
                }
                this.showMessage('Node updated successfully');
            } else {
                // Create new node
                const position = this.getNewNodePosition();
                response = await this.apiClient.post('/mindmap/nodes', {
                    title,
                    content,
                    tags,
                    position
                });
                if (!response) {
                    this.showError('Malformed response from server (no node object)');
                    return;
                }
                if (!response || !response._id) {
                    this.showError('Malformed response from server (missing node _id, or not authenticated)');
                    return;
                }
                // Add node to graph
                window.nexusEngine.addNodeToGraph(response);
                // Center view on new node
                const newNode = window.nexusEngine.cy.getElementById(response._id);
                window.nexusEngine.cy.center(newNode);
                window.nexusEngine.cy.zoom(1.5);
                window.nexusEngine.selectNode(newNode);
                this.showMessage('Node created successfully');
            }
            
            // Close modal
            this.close();
            
        } catch (error) {
            console.error('Failed to save node:', error);
            this.showError(error.response?.data?.message || 'Failed to save node');
        }
    }
    
    getNewNodePosition() {
        // Get viewport center
        const extent = window.nexusEngine.cy.extent();
        const center = {
            x: (extent.x1 + extent.x2) / 2,
            y: (extent.y1 + extent.y2) / 2
        };
        
        // Add some randomness to avoid overlapping
        return {
            x: center.x + (Math.random() - 0.5) * 200,
            y: center.y + (Math.random() - 0.5) * 200
        };
    }
    
    close() {
        document.getElementById('nodeEditorModal').style.display = 'none';
        this.currentNode = null;
        this.isEditMode = false;
    }
    
    isOpen() {
        return document.getElementById('nodeEditorModal').style.display === 'block';
    }
    
    showMessage(message) {
        // Could be enhanced with a toast notification
        console.log(message);
    }
    
    showError(message) {
        console.error(message);
        alert(message); // Simple alert for now
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.nodeEditor = new NodeEditor();
}); 