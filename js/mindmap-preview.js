/**
 * Mindmap Preview for Front Page
 * Simplified version of the full mindmap functionality
 */
class MindmapPreview {
    constructor() {
        this.container = document.getElementById('mindmapPreview');
        this.nodesContainer = document.getElementById('mindmapPreviewNodes');
        this.connectionsContainer = document.getElementById('mindmapPreviewConnections');
        this.tooltip = document.getElementById('mindmapPreviewTooltip');
        this.searchInput = document.getElementById('mindmapPreviewSearch');
        this.searchBtn = document.getElementById('mindmapPreviewSearchBtn');
        this.statsContainer = document.getElementById('mindmapStats');
        
        this.data = null;
        this.selectedNode = null;
        
        console.log('MindmapPreview: Constructor - Elements found:', {
            container: !!this.container,
            nodesContainer: !!this.nodesContainer,
            connectionsContainer: !!this.connectionsContainer,
            tooltip: !!this.tooltip,
            searchInput: !!this.searchInput,
            searchBtn: !!this.searchBtn,
            statsContainer: !!this.statsContainer
        });
        
        this.init();
    }
    
    async init() {
        console.log('MindmapPreview: Initializing...');
        try {
            // Load preview data
            await this.loadPreviewData();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Hide loading indicator
            const loading = this.container.querySelector('.mindmap-loading');
            if (loading) {
                loading.style.display = 'none';
            }
            
            console.log('MindmapPreview: Initialized successfully');
        } catch (error) {
            console.error('Failed to initialize mindmap preview:', error);
            this.showError('Failed to load Nexus preview');
        }
    }
    
    async loadPreviewData() {
        try {
            console.log('MindmapPreview: Loading preview data...');
            const apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
            const response = await fetch(`${apiBaseUrl}/mindmap/preview`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.data = await response.json();
            console.log('MindmapPreview: Data loaded:', this.data);
            
            // Render the preview
            this.renderNodes();
            this.renderConnections();
            this.renderStats();
            
        } catch (error) {
            console.error('Failed to load preview data:', error);
            throw error;
        }
    }
    
    renderNodes() {
        if (!this.data || !this.data.nodes) return;
        
        this.nodesContainer.innerHTML = '';
        
        // Handle empty state
        if (this.data.nodes.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.data.nodes.forEach(node => {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'mindmap-preview-node';
            nodeElement.dataset.nodeId = node._id;
            
            // Set position
            nodeElement.style.left = node.position.x + 'px';
            nodeElement.style.top = node.position.y + 'px';
            
            // Set credibility class
            const credibilityClass = this.getCredibilityClass(node.credibility.score);
            nodeElement.classList.add(credibilityClass);
            
            // Set content
            nodeElement.innerHTML = `
                <div class="node-content">
                    <h4>${node.title}</h4>
                    <div class="node-score">${node.credibility.score}</div>
                </div>
            `;
            
            // Add event listeners
            nodeElement.addEventListener('mouseenter', (e) => this.showTooltip(e, node));
            nodeElement.addEventListener('mouseleave', () => this.hideTooltip());
            nodeElement.addEventListener('click', () => this.selectNode(node));
            
            this.nodesContainer.appendChild(nodeElement);
        });
    }
    
    renderConnections() {
        if (!this.data || !this.data.edges) return;
        
        // Clear existing connections
        this.connectionsContainer.innerHTML = '';
        
        // Set SVG dimensions to match container
        const containerRect = this.container.getBoundingClientRect();
        this.connectionsContainer.setAttribute('width', '100%');
        this.connectionsContainer.setAttribute('height', '100%');
        this.connectionsContainer.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
        
        this.data.edges.forEach(edge => {
            const sourceNode = this.data.nodes.find(n => n._id === edge.sourceNode);
            const targetNode = this.data.nodes.find(n => n._id === edge.targetNode);
            
            if (sourceNode && targetNode) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', sourceNode.position.x + 60); // Center of node
                line.setAttribute('y1', sourceNode.position.y + 30);
                line.setAttribute('x2', targetNode.position.x + 60);
                line.setAttribute('y2', targetNode.position.y + 30);
                line.setAttribute('stroke', 'rgba(233, 69, 96, 0.6)');
                line.setAttribute('stroke-width', '2');
                line.classList.add('mindmap-connection');
                
                // Add relationship label
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                const midX = (sourceNode.position.x + targetNode.position.x) / 2 + 60;
                const midY = (sourceNode.position.y + targetNode.position.y) / 2 + 30;
                text.setAttribute('x', midX);
                text.setAttribute('y', midY - 5);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', '#f1f1f1');
                text.setAttribute('font-size', '12px');
                text.textContent = edge.relationshipLabel;
                text.classList.add('mindmap-label');
                
                this.connectionsContainer.appendChild(line);
                this.connectionsContainer.appendChild(text);
            }
        });
    }
    
    renderStats() {
        if (!this.data || !this.data.stats) return;
        
        this.statsContainer.innerHTML = `
            <div class="stats-item">
                <i class="fas fa-circle"></i>
                <span>${this.data.stats.totalNodes} nodes</span>
            </div>
            <div class="stats-item">
                <i class="fas fa-link"></i>
                <span>${this.data.stats.totalConnections} connections</span>
            </div>
            <div class="stats-activity">
                <i class="fas fa-clock"></i>
                <span>${this.data.stats.recentActivity}</span>
            </div>
        `;
    }
    
    getCredibilityClass(score) {
        if (score >= 70) return 'high-credibility';
        if (score >= 40) return 'medium-credibility';
        return 'low-credibility';
    }
    
    showTooltip(event, node) {
        this.tooltip.querySelector('.tooltip-title').textContent = node.title;
        this.tooltip.querySelector('.tooltip-score').textContent = `Score: ${node.credibility.score}`;
        this.tooltip.querySelector('.tooltip-content').textContent = node.content.substring(0, 100) + '...';
        this.tooltip.querySelector('.tooltip-creator').textContent = `By ${node.creator.username}`;
        
        const connections = this.data.edges.filter(e => e.sourceNode === node._id || e.targetNode === node._id);
        this.tooltip.querySelector('.tooltip-connections').textContent = `${connections.length} connections`;
        
        // Position tooltip
        const rect = this.container.getBoundingClientRect();
        this.tooltip.style.left = (event.pageX - rect.left + 10) + 'px';
        this.tooltip.style.top = (event.pageY - rect.top - 10) + 'px';
        this.tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
    
    selectNode(node) {
        this.selectedNode = node;
        
        // Update explore button
        const exploreBtn = document.getElementById('exploreNodeBtn');
        exploreBtn.onclick = () => {
            // Redirect to full mindmap with this node selected
            window.location.href = `/pages/mindmap.html?node=${node._id}`;
        };
        
        // Highlight selected node
        this.highlightNode(node._id);
    }
    
    highlightNode(nodeId) {
        // Remove previous highlights
        const nodes = this.nodesContainer.querySelectorAll('.mindmap-preview-node');
        nodes.forEach(n => n.classList.remove('selected'));
        
        // Add highlight to selected node
        const selectedNode = this.nodesContainer.querySelector(`[data-node-id="${nodeId}"]`);
        if (selectedNode) {
            selectedNode.classList.add('selected');
        }
    }
    
    setupEventHandlers() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        // Hide tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.tooltip.contains(e.target) && !this.nodesContainer.contains(e.target)) {
                this.hideTooltip();
            }
        });
    }
    
    handleSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;
        
        // For preview, just redirect to full mindmap with search
        window.location.href = `/pages/mindmap.html?search=${encodeURIComponent(query)}`;
    }
    
    showEmptyState() {
        this.container.innerHTML = `
            <div class="mindmap-empty">
                <i class="fas fa-project-diagram"></i>
                <h3>The Infinite Nexus Awaits</h3>
                <p>No nodes have been created yet. Be the first to contribute to the eternal knowledge web.</p>
                <a href="/pages/mindmap.html" class="btn btn-primary">Create First Node</a>
            </div>
        `;
    }
    
    showError(message) {
        this.container.innerHTML = `
            <div class="mindmap-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page with the mindmap preview
    if (document.getElementById('mindmapPreview')) {
        window.mindmapPreview = new MindmapPreview();
    }
});