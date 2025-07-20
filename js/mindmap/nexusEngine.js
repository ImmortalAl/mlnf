/**
 * Infinite Nexus Engine
 * Main controller for the mindmap visualization
 */
class NexusEngine {
    constructor() {
        this.cy = null;
        this.nodes = new Map();
        this.edges = new Map();
        this.selectedNode = null;
        this.connectMode = false;
        this.sourceNode = null;
        this.apiClient = window.apiClient;
        this.currentUserId = null;
        this.currentUsername = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Get current user info
            if (window.authManager && window.authManager.isLoggedIn()) {
                const user = window.authManager.getUser();
                this.currentUserId = user._id || user.id;
                this.currentUsername = user.username;
            }
            
            // Initialize Cytoscape
            this.initCytoscape();
            
            // Load existing mindmap data
            await this.loadMindmap();
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Initialize WebSocket for real-time updates
            this.initWebSocket();
            
            // Remove loading indicator
            document.querySelector('.mindmap-loading').style.display = 'none';
        } catch (error) {
            console.error('Failed to initialize mindmap:', error);
            this.showError('Failed to load the Infinite Nexus');
        }
    }
    
    initCytoscape() {
        console.log('Initializing Cytoscape...');
        console.log('cytoscape function available:', typeof cytoscape);
        
        const container = document.getElementById('cy');
        console.log('Container element:', container);
        
        if (!container) {
            throw new Error('Mindmap container element (#cy) not found');
        }
        
        if (typeof cytoscape === 'undefined') {
            throw new Error('Cytoscape library not loaded');
        }
        
        this.cy = cytoscape({
            container: container,
            
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#1a1a2e',
                        'border-color': '#e94560',
                        'border-width': 2,
                        'label': 'data(title)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'color': '#f1f1f1',
                        'font-size': '14px',
                        'width': 'mapData(credibilityScore, 0, 100, 40, 120)',
                        'height': 'mapData(credibilityScore, 0, 100, 40, 120)',
                        'transition-property': 'width, height, background-color',
                        'transition-duration': '0.3s'
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'background-color': '#e94560',
                        'border-width': 3,
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': 'rgba(233, 69, 96, 0.6)',
                        'target-arrow-color': 'rgba(233, 69, 96, 0.6)',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(relationshipLabel)',
                        'text-rotation': 'autorotate',
                        'text-margin-y': -10,
                        'font-size': '12px',
                        'color': '#f1f1f1',
                        'text-background-color': '#1a1a2e',
                        'text-background-opacity': 0.8,
                        'text-background-padding': '3px'
                    }
                },
                {
                    selector: '.high-credibility',
                    style: {
                        'border-color': '#4CAF50',
                        'background-color': '#1b2d1b'
                    }
                },
                {
                    selector: '.medium-credibility',
                    style: {
                        'border-color': '#FF9800',
                        'background-color': '#2d251b'
                    }
                },
                {
                    selector: '.low-credibility',
                    style: {
                        'border-color': '#F44336',
                        'background-color': '#2d1b1b'
                    }
                }
            ],
            
            layout: {
                name: 'cose',
                animate: true,
                animationDuration: 500,
                nodeRepulsion: 8000,
                idealEdgeLength: 100,
                edgeElasticity: 100,
                nestingFactor: 5,
                gravity: 80,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            },
            
            // Interaction options
            minZoom: 0.1,
            maxZoom: 3
        });
    }
    
    async loadMindmap() {
        try {
            console.log('Loading mindmap data...');
            const response = await this.apiClient.get('/mindmap');
            console.log('Raw API response:', response);
            
            // Validate response structure
            if (!response) {
                console.error('Response is null or undefined');
                return;
            }
            
            // Handle different response structures
            let nodes, edges;
            if (response.data) {
                // If response has a data wrapper
                nodes = response.data.nodes || [];
                edges = response.data.edges || [];
                console.log('Using response.data structure');
            } else {
                // Direct response structure
                nodes = response.nodes || [];
                edges = response.edges || [];
                console.log('Using direct response structure');
            }
            
            console.log(`Loading ${nodes.length} nodes and ${edges.length} edges`);
            
            // Add nodes to Cytoscape
            nodes.forEach(node => {
                this.addNodeToGraph(node);
            });
            
            // Add edges to Cytoscape
            edges.forEach(edge => {
                this.addEdgeToGraph(edge);
            });
            
            // Run layout
            this.cy.layout({ name: 'cose' }).run();
            console.log('Mindmap loaded successfully');
        } catch (error) {
            console.error('Failed to load mindmap data:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response
            });
            // Start with empty mindmap if loading fails
        }
    }
    
    addNodeToGraph(nodeData) {
        const cyNode = {
            group: 'nodes',
            data: {
                id: nodeData._id,
                title: nodeData.title,
                content: nodeData.content,
                credibilityScore: nodeData.credibility.score,
                creator: nodeData.creator,
                tags: nodeData.tags,
                credibility: nodeData.credibility,
                ...nodeData
            },
            position: nodeData.position || { x: Math.random() * 500, y: Math.random() * 500 }
        };
        
        this.cy.add(cyNode);
        this.nodes.set(nodeData._id, nodeData);
        
        // Apply credibility class
        this.updateNodeCredibilityClass(nodeData._id, nodeData.credibility.score);
    }
    
    addEdgeToGraph(edgeData) {
        const cyEdge = {
            group: 'edges',
            data: {
                id: edgeData._id,
                source: edgeData.sourceNode,
                target: edgeData.targetNode,
                relationshipLabel: edgeData.relationshipLabel,
                creator: edgeData.creator
            }
        };
        
        this.cy.add(cyEdge);
        this.edges.set(edgeData._id, edgeData);
    }
    
    updateNodeCredibilityClass(nodeId, score) {
        const node = this.cy.getElementById(nodeId);
        node.removeClass('high-credibility medium-credibility low-credibility');
        
        if (score >= 70) {
            node.addClass('high-credibility');
        } else if (score >= 40) {
            node.addClass('medium-credibility');
        } else {
            node.addClass('low-credibility');
        }
    }
    
    setupEventHandlers() {
        // Node selection
        this.cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            this.selectNode(node);
        });
        
        // Background tap - deselect
        this.cy.on('tap', (evt) => {
            if (evt.target === this.cy) {
                this.deselectAll();
            }
        });
        
        // Edge creation in connect mode
        this.cy.on('tap', 'node', (evt) => {
            if (this.connectMode) {
                this.handleConnectMode(evt.target);
            }
        });
        
        // Edge label editing
        this.cy.on('tap', 'edge', (evt) => {
            if (!this.connectMode) {
                this.editEdgeLabel(evt.target);
            }
        });
        
        // Add node button
        document.getElementById('add-node-btn').addEventListener('click', () => {
            window.nodeEditor.openForCreate();
        });
        
        // Connect mode button
        document.getElementById('connect-mode-btn').addEventListener('click', () => {
            this.toggleConnectMode();
        });
        
        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => {
            this.performSearch();
        });
        
        document.getElementById('mindmap-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // Node details panel buttons
        document.getElementById('upvoteBtn').addEventListener('click', () => {
            this.voteOnNode(1);
        });
        
        document.getElementById('downvoteBtn').addEventListener('click', () => {
            this.voteOnNode(-1);
        });
        
        document.getElementById('editNodeBtn').addEventListener('click', () => {
            if (this.selectedNode) {
                window.nodeEditor.openForEdit(this.nodes.get(this.selectedNode.id()));
            }
        });
        
        document.getElementById('deleteNodeBtn').addEventListener('click', () => {
            if (this.selectedNode) {
                this.deleteNode(this.selectedNode.id());
            }
        });
        
        document.getElementById('addCitationBtn').addEventListener('click', () => {
            this.openCitationModal();
        });
        
        // Connection modal
        document.getElementById('confirmConnection').addEventListener('click', () => {
            this.confirmConnection();
        });
        
        document.getElementById('cancelConnection').addEventListener('click', () => {
            this.cancelConnection();
        });
        
        // Relationship label autocomplete
        document.getElementById('relationshipLabel').addEventListener('input', (e) => {
            this.fetchLabelSuggestions(e.target.value);
        });
        
        // Close buttons
        document.getElementById('closeNodeDetails').addEventListener('click', () => {
            document.getElementById('nodeDetailsPanel').style.display = 'none';
        });
        
        document.getElementById('closeCitationModal').addEventListener('click', () => {
            document.getElementById('citationModal').style.display = 'none';
        });
        
        // Edit relationship modal
        document.getElementById('editRelationshipForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateRelationship();
        });
        
        document.getElementById('closeEditRelationship').addEventListener('click', () => {
            document.getElementById('editRelationshipModal').style.display = 'none';
        });
        
        document.getElementById('deleteRelationshipBtn').addEventListener('click', () => {
            this.deleteRelationship();
        });
        
        document.getElementById('editRelationshipLabel').addEventListener('input', (e) => {
            this.fetchRelationshipSuggestions(e.target.value);
        });
    }
    
    selectNode(node) {
        this.selectedNode = node;
        const nodeData = this.nodes.get(node.id());
        
        if (!nodeData) {
            console.error('Node data not found for node ID:', node.id());
            console.log('Available nodes:', Array.from(this.nodes.keys()));
            this.showError('Node data not found. Please refresh the page.');
            return;
        }
        
        // Update details panel
        document.getElementById('nodeTitle').textContent = nodeData.title || 'Untitled';
        document.getElementById('nodeContent').innerHTML = nodeData.content || '';
        document.getElementById('credibilityScore').textContent = nodeData.credibility?.score || 0;
        
        // Update citations list
        const citationsList = document.getElementById('citationsList');
        citationsList.innerHTML = '';
        if (nodeData.credibility && nodeData.credibility.citations) {
            nodeData.credibility.citations.forEach(citation => {
                const citationDiv = document.createElement('div');
                citationDiv.className = 'citation-item';
                citationDiv.innerHTML = `
                    <a href="${citation.url}" target="_blank">${citation.url}</a>
                    <p>${citation.description || ''}</p>
                    <small>Added by ${citation.addedBy?.username || 'Unknown'}</small>
                `;
                citationsList.appendChild(citationDiv);
            });
        }
        
        // Check if user has voted
        const userVote = nodeData.credibility?.votes?.find(v => v.user === this.currentUserId);
        document.getElementById('upvoteBtn').classList.toggle('voted', userVote?.value === 1);
        document.getElementById('downvoteBtn').classList.toggle('voted', userVote?.value === -1);
        
        // Show details panel
        document.getElementById('nodeDetailsPanel').style.display = 'block';
    }
    
    deselectAll() {
        this.cy.elements().unselect();
        document.getElementById('nodeDetailsPanel').style.display = 'none';
        this.selectedNode = null;
    }
    
    toggleConnectMode() {
        this.connectMode = !this.connectMode;
        const btn = document.getElementById('connect-mode-btn');
        btn.classList.toggle('active', this.connectMode);
        
        if (this.connectMode) {
            this.cy.container().style.cursor = 'crosshair';
            this.showMessage('Click a source node, then a target node to connect them');
        } else {
            this.cy.container().style.cursor = 'default';
            this.sourceNode = null;
        }
    }
    
    handleConnectMode(node) {
        if (!this.sourceNode) {
            this.sourceNode = node;
            node.addClass('source-node');
            this.showMessage('Now click the target node');
        } else if (node.id() !== this.sourceNode.id()) {
            // Show connection modal
            this.showConnectionModal(this.sourceNode, node);
        }
    }
    
    showConnectionModal(source, target) {
        const modal = document.getElementById('connectionModal');
        modal.style.display = 'block';
        
        // Position modal near the connection
        const sourcePos = source.renderedPosition();
        const targetPos = target.renderedPosition();
        modal.style.left = `${(sourcePos.x + targetPos.x) / 2}px`;
        modal.style.top = `${(sourcePos.y + targetPos.y) / 2}px`;
        
        // Store nodes for connection
        this.pendingConnection = { source, target };
        
        // Focus input
        document.getElementById('relationshipLabel').value = '';
        document.getElementById('relationshipLabel').focus();
    }
    
    async confirmConnection() {
        const relationshipLabel = document.getElementById('relationshipLabel').value.trim();
        if (!relationshipLabel) {
            this.showError('Please enter a relationship type');
            return;
        }
        
        try {
            const response = await this.apiClient.post('/mindmap/edges', {
                sourceNode: this.pendingConnection.source.id(),
                targetNode: this.pendingConnection.target.id(),
                relationshipLabel
            });
            
            this.addEdgeToGraph(response);
            this.cancelConnection();
            this.showMessage('Connection created successfully');
        } catch (error) {
            console.error('Failed to create connection:', error);
            this.showError('Failed to create connection');
        }
    }
    
    cancelConnection() {
        document.getElementById('connectionModal').style.display = 'none';
        if (this.sourceNode) {
            this.sourceNode.removeClass('source-node');
        }
        this.sourceNode = null;
        this.pendingConnection = null;
        this.toggleConnectMode();
    }
    
    async fetchLabelSuggestions(query) {
        if (query.length < 2) {
            document.getElementById('labelSuggestions').style.display = 'none';
            return;
        }
        
        try {
            const response = await this.apiClient.get(`/mindmap/labels/suggestions?q=${query}`);
            const suggestions = response;
            
            const suggestionsDiv = document.getElementById('labelSuggestions');
            suggestionsDiv.innerHTML = '';
            
            suggestions.forEach(label => {
                const div = document.createElement('div');
                div.className = 'label-suggestion';
                div.textContent = label;
                div.onclick = () => {
                    document.getElementById('relationshipLabel').value = label;
                    suggestionsDiv.style.display = 'none';
                };
                suggestionsDiv.appendChild(div);
            });
            
            suggestionsDiv.style.display = suggestions.length > 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Failed to fetch label suggestions:', error);
        }
    }
    
    async voteOnNode(value) {
        if (!this.selectedNode) return;
        
        try {
            const response = await this.apiClient.post(`/mindmap/nodes/${this.selectedNode.id()}/vote`, {
                value
            });
            
            // Update local data
            const nodeData = this.nodes.get(this.selectedNode.id());
            nodeData.credibility = response.credibility;
            
            // Update UI
            document.getElementById('credibilityScore').textContent = nodeData.credibility.score;
            this.selectedNode.data('credibilityScore', nodeData.credibility.score);
            this.updateNodeCredibilityClass(this.selectedNode.id(), nodeData.credibility.score);
            
            // Update vote buttons
            document.getElementById('upvoteBtn').classList.toggle('voted', value === 1);
            document.getElementById('downvoteBtn').classList.toggle('voted', value === -1);
            
            this.showMessage(response.message);
        } catch (error) {
            console.error('Failed to vote:', error);
            this.showError('Failed to record vote');
        }
    }
    
    openCitationModal() {
        if (!this.selectedNode) return;
        
        document.getElementById('citationModal').style.display = 'block';
        document.getElementById('citationForm').onsubmit = async (e) => {
            e.preventDefault();
            await this.addCitation();
        };
    }
    
    async addCitation() {
        const url = document.getElementById('citationUrl').value;
        const description = document.getElementById('citationDescription').value;
        
        try {
            const response = await this.apiClient.post(`/mindmap/nodes/${this.selectedNode.id()}/citations`, {
                url,
                description
            });
            
            // Update local data
            const nodeData = this.nodes.get(this.selectedNode.id());
            nodeData.credibility = response.credibility;
            
            // Refresh node details
            this.selectNode(this.selectedNode);
            
            // Close modal
            document.getElementById('citationModal').style.display = 'none';
            document.getElementById('citationForm').reset();
            
            this.showMessage('Citation added successfully');
        } catch (error) {
            console.error('Failed to add citation:', error);
            this.showError('Failed to add citation');
        }
    }
    
    async deleteNode(nodeId) {
        const nodeData = this.nodes.get(nodeId);
        if (!nodeData) {
            this.showError('Node not found');
            return;
        }
        
        // Confirm deletion
        const confirmed = confirm(`Are you sure you want to delete the node "${nodeData.title}"?\n\nThis action cannot be undone and will also remove all connections to this node.`);
        if (!confirmed) {
            return;
        }
        
        try {
            await this.apiClient.delete(`/mindmap/nodes/${nodeId}`);
            
            // Remove from graph immediately
            const node = this.cy.getElementById(nodeId);
            if (node.length > 0) {
                // If this is the selected node, deselect first
                if (this.selectedNode && this.selectedNode.id() === nodeId) {
                    this.deselectAll();
                }
                
                // Remove node (this also removes connected edges)
                node.remove();
            }
            
            // Remove from local data
            this.nodes.delete(nodeId);
            
            this.showMessage('Node deleted successfully');
        } catch (error) {
            console.error('Failed to delete node:', error);
            this.showError('Failed to delete node');
        }
    }
    
    editEdgeLabel(edge) {
        this.selectedEdge = edge;
        const edgeData = this.edges.get(edge.id());
        
        if (!edgeData) {
            this.showError('Edge data not found');
            return;
        }
        
        // Populate modal with current relationship label
        document.getElementById('editRelationshipLabel').value = edgeData.relationshipLabel || '';
        
        // Show modal
        document.getElementById('editRelationshipModal').style.display = 'block';
        
        // Focus input
        document.getElementById('editRelationshipLabel').focus();
        document.getElementById('editRelationshipLabel').select();
    }
    
    async updateRelationship() {
        const newLabel = document.getElementById('editRelationshipLabel').value.trim();
        if (!newLabel) {
            this.showError('Please enter a relationship type');
            return;
        }
        
        if (!this.selectedEdge) {
            this.showError('No edge selected');
            return;
        }
        
        try {
            const response = await this.apiClient.put(`/mindmap/edges/${this.selectedEdge.id()}`, {
                relationshipLabel: newLabel
            });
            
            // Update edge label in graph
            this.selectedEdge.data('relationshipLabel', newLabel);
            
            // Update local data
            const edgeData = this.edges.get(this.selectedEdge.id());
            if (edgeData) {
                edgeData.relationshipLabel = newLabel;
            }
            
            // Close modal
            document.getElementById('editRelationshipModal').style.display = 'none';
            this.selectedEdge = null;
            
            this.showMessage('Relationship updated successfully');
        } catch (error) {
            console.error('Failed to update relationship:', error);
            this.showError('Failed to update relationship');
        }
    }
    
    async deleteRelationship() {
        if (!this.selectedEdge) {
            this.showError('No edge selected');
            return;
        }
        
        const edgeData = this.edges.get(this.selectedEdge.id());
        const confirmed = confirm(`Are you sure you want to delete this relationship?\n\nType: "${edgeData?.relationshipLabel || 'Unknown'}"\n\nThis action cannot be undone.`);
        
        if (!confirmed) {
            return;
        }
        
        try {
            await this.apiClient.delete(`/mindmap/edges/${this.selectedEdge.id()}`);
            
            // Remove from graph
            this.selectedEdge.remove();
            
            // Remove from local data
            this.edges.delete(this.selectedEdge.id());
            
            // Close modal
            document.getElementById('editRelationshipModal').style.display = 'none';
            this.selectedEdge = null;
            
            this.showMessage('Relationship deleted successfully');
        } catch (error) {
            console.error('Failed to delete relationship:', error);
            this.showError('Failed to delete relationship');
        }
    }
    
    async fetchRelationshipSuggestions(query) {
        if (query.length < 2) {
            document.getElementById('editRelationshipSuggestions').style.display = 'none';
            return;
        }
        
        try {
            const response = await this.apiClient.get(`/mindmap/labels/suggestions?q=${query}`);
            const suggestions = response;
            
            const suggestionsDiv = document.getElementById('editRelationshipSuggestions');
            suggestionsDiv.innerHTML = '';
            
            suggestions.forEach(label => {
                const div = document.createElement('div');
                div.className = 'relationship-suggestion';
                div.textContent = label;
                div.onclick = () => {
                    document.getElementById('editRelationshipLabel').value = label;
                    suggestionsDiv.style.display = 'none';
                };
                suggestionsDiv.appendChild(div);
            });
            
            suggestionsDiv.style.display = suggestions.length > 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Failed to fetch relationship suggestions:', error);
            document.getElementById('editRelationshipSuggestions').style.display = 'none';
        }
    }
    
    async performSearch() {
        const query = document.getElementById('mindmap-search').value.trim();
        if (!query) {
            this.cy.elements().removeClass('search-match search-dimmed');
            document.getElementById('searchResults').style.display = 'none';
            return;
        }
        
        try {
            const response = await this.apiClient.get(`/mindmap/search?q=${query}`);
            const results = response.results;
            
            // Highlight matching nodes
            this.cy.elements().addClass('search-dimmed');
            results.forEach(result => {
                this.cy.getElementById(result._id).removeClass('search-dimmed').addClass('search-match');
            });
            
            // Show results panel
            const resultsDiv = document.getElementById('searchResults');
            resultsDiv.innerHTML = `<h4>Search Results (${results.length})</h4>`;
            
            results.forEach(result => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <strong>${result.title}</strong>
                    <small>Credibility: ${result.credibility.score}</small>
                `;
                div.onclick = () => {
                    const node = this.cy.getElementById(result._id);
                    this.cy.center(node);
                    this.cy.zoom(1.5);
                    this.selectNode(node);
                };
                resultsDiv.appendChild(div);
            });
            
            resultsDiv.style.display = 'block';
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed');
        }
    }
    
    initWebSocket() {
        // Use the existing MLNF WebSocket manager
        if (window.MLNF && window.MLNF.websocket) {
            // Register mindmap-specific handlers
            window.MLNF.websocket.on('nodeCreated', (data) => {
                this.handleNodeCreated(data);
            });
            
            window.MLNF.websocket.on('nodeUpdated', (data) => {
                this.handleNodeUpdated(data);
            });
            
            window.MLNF.websocket.on('nodeDeleted', (data) => {
                this.handleNodeDeleted(data);
            });
            
            window.MLNF.websocket.on('edgeCreated', (data) => {
                this.handleEdgeCreated(data);
            });
            
            window.MLNF.websocket.on('edgeUpdated', (data) => {
                this.handleEdgeUpdated(data);
            });
            
            window.MLNF.websocket.on('edgeDeleted', (data) => {
                this.handleEdgeDeleted(data);
            });
            
            window.MLNF.websocket.on('nodeVoted', (data) => {
                this.handleNodeVoted(data);
            });
            
            window.MLNF.websocket.on('citationAdded', (data) => {
                this.handleCitationAdded(data);
            });
        }
    }
    
    // WebSocket event handlers
    handleNodeCreated(data) {
        // Don't add if we created it (already added)
        if (!this.nodes.has(data._id)) {
            this.addNodeToGraph(data);
            this.showMessage('New node added to the Nexus');
        }
    }
    
    handleNodeUpdated(data) {
        const node = this.cy.getElementById(data._id);
        if (node.length > 0) {
            // Update node data
            node.data('title', data.title);
            node.data('content', data.content);
            node.data('tags', data.tags);
            
            // Update local data
            this.nodes.set(data._id, data);
            
            // If this is the selected node, refresh details
            if (this.selectedNode && this.selectedNode.id() === data._id) {
                this.selectNode(node);
            }
        }
    }
    
    handleNodeDeleted(data) {
        const node = this.cy.getElementById(data.nodeId);
        if (node.length > 0) {
            // If this is the selected node, deselect
            if (this.selectedNode && this.selectedNode.id() === data.nodeId) {
                this.deselectAll();
            }
            
            // Remove from graph
            node.remove();
            this.nodes.delete(data.nodeId);
            
            this.showMessage('Node removed from the Nexus');
        }
    }
    
    handleEdgeCreated(data) {
        // Don't add if we created it (already added)
        if (!this.edges.has(data._id)) {
            this.addEdgeToGraph(data);
        }
    }
    
    handleEdgeUpdated(data) {
        const edge = this.cy.getElementById(data._id);
        if (edge.length > 0) {
            edge.data('relationshipLabel', data.relationshipLabel);
            this.edges.set(data._id, data);
        }
    }
    
    handleEdgeDeleted(data) {
        const edge = this.cy.getElementById(data.edgeId);
        if (edge.length > 0) {
            edge.remove();
            this.edges.delete(data.edgeId);
        }
    }
    
    handleNodeVoted(data) {
        const node = this.cy.getElementById(data.nodeId);
        if (node.length > 0) {
            // Update credibility
            node.data('credibilityScore', data.credibility.score);
            this.updateNodeCredibilityClass(data.nodeId, data.credibility.score);
            
            // Update local data
            const nodeData = this.nodes.get(data.nodeId);
            if (nodeData) {
                nodeData.credibility = data.credibility;
                
                // If this is the selected node, refresh details
                if (this.selectedNode && this.selectedNode.id() === data.nodeId) {
                    document.getElementById('credibilityScore').textContent = data.credibility.score;
                }
            }
        }
    }
    
    handleCitationAdded(data) {
        const nodeData = this.nodes.get(data.nodeId);
        if (nodeData) {
            nodeData.credibility = data.credibility;
            
            // If this is the selected node, refresh details
            if (this.selectedNode && this.selectedNode.id() === data.nodeId) {
                this.selectNode(this.selectedNode);
            }
        }
    }
    
    showMessage(message) {
        // Simple message display - could be enhanced with a toast notification
        console.log(message);
    }
    
    showError(message) {
        console.error(message);
        alert(message); // Simple alert for now
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.nexusEngine = new NexusEngine();
}); 