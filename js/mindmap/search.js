/**
 * Mindmap Search Module
 * Handles search functionality with filters and visual feedback
 */
class MindmapSearch {
    constructor(nexusEngine) {
        this.nexusEngine = nexusEngine;
        this.apiClient = window.apiClient;
        this.searchResults = [];
        this.searchTimeout = null;
        
        this.init();
    }
    
    init() {
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        const searchInput = document.getElementById('mindmap-search');
        const searchBtn = document.getElementById('search-btn');
        const filterBtn = document.getElementById('filter-btn');
        
        // Search input with debouncing
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
        
        // Search button
        searchBtn.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });
        
        // Enter key in search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });
        
        // Filter button
        filterBtn.addEventListener('click', () => {
            this.showFilterModal();
        });
        
        // Click outside search results to close
        document.addEventListener('click', (e) => {
            const searchResults = document.getElementById('searchResults');
            const searchContainer = document.querySelector('.search-container');
            if (!searchResults.contains(e.target) && !searchContainer.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
    
    async performSearch(query) {
        const trimmedQuery = query.trim();
        
        if (!trimmedQuery) {
            this.clearSearch();
            return;
        }
        
        try {
            // Get filter values if any
            const filters = this.getActiveFilters();
            
            // Build query parameters
            const params = new URLSearchParams({ q: trimmedQuery });
            if (filters.minCredibility) {
                params.append('minCredibility', filters.minCredibility);
            }
            if (filters.tags && filters.tags.length > 0) {
                params.append('tags', filters.tags.join(','));
            }
            if (filters.creator) {
                params.append('creator', filters.creator);
            }
            
            // Perform search
            const response = await this.apiClient.get(`/mindmap/search?${params}`);
            this.searchResults = response.results;
            
            // Update visual feedback
            this.highlightSearchResults();
            this.displaySearchResults();
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed');
        }
    }
    
    highlightSearchResults() {
        // Reset all nodes
        this.nexusEngine.cy.elements().removeClass('search-match search-dimmed');
        
        if (this.searchResults.length === 0) {
            return;
        }
        
        // Dim all elements first
        this.nexusEngine.cy.elements().addClass('search-dimmed');
        
        // Highlight matching nodes and their edges
        this.searchResults.forEach(result => {
            const node = this.nexusEngine.cy.getElementById(result._id);
            if (node.length > 0) {
                node.removeClass('search-dimmed').addClass('search-match');
                // Also highlight connected edges
                node.connectedEdges().removeClass('search-dimmed');
            }
        });
    }
    
    displaySearchResults() {
        const resultsDiv = document.getElementById('searchResults');
        
        if (this.searchResults.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">No results found</div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        // Build results HTML
        let html = `<h4>Search Results (${this.searchResults.length})</h4>`;
        
        this.searchResults.forEach(result => {
            const tags = result.tags.length > 0 ? result.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
            
            html += `
                <div class="search-result-item" data-id="${result._id}">
                    <strong>${this.escapeHtml(result.title)}</strong>
                    <div class="result-meta">
                        <span class="credibility">Credibility: ${result.credibility.score}</span>
                        ${tags}
                    </div>
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
        
        // Add click handlers to results
        resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const nodeId = item.dataset.id;
                this.focusOnNode(nodeId);
            });
        });
    }
    
    focusOnNode(nodeId) {
        const node = this.nexusEngine.cy.getElementById(nodeId);
        if (node.length > 0) {
            // Center and zoom on node
            this.nexusEngine.cy.animate({
                center: { eles: node },
                zoom: 1.5
            }, {
                duration: 500
            });
            
            // Select the node
            this.nexusEngine.selectNode(node);
            
            // Hide search results
            document.getElementById('searchResults').style.display = 'none';
        }
    }
    
    clearSearch() {
        // Clear visual highlighting
        this.nexusEngine.cy.elements().removeClass('search-match search-dimmed');
        
        // Hide results
        document.getElementById('searchResults').style.display = 'none';
        
        // Clear results array
        this.searchResults = [];
    }
    
    showFilterModal() {
        // Create filter modal if it doesn't exist
        if (!document.getElementById('filterModal')) {
            this.createFilterModal();
        }
        
        document.getElementById('filterModal').classList.add('show');
    }
    
    createFilterModal() {
        const modal = document.createElement('div');
        modal.id = 'filterModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="document.getElementById('filterModal').classList.remove('show')">×</span>
                <h3>Search Filters</h3>
                <form id="filterForm">
                    <div>
                        <label for="minCredibility">Minimum Credibility</label>
                        <input type="range" id="minCredibility" min="0" max="100" value="0">
                        <span id="credibilityValue">0</span>
                    </div>
                    <div>
                        <label for="filterTags">Tags (comma separated)</label>
                        <input type="text" id="filterTags" placeholder="science, technology">
                    </div>
                    <div>
                        <label for="filterCreator">Creator Username</label>
                        <input type="text" id="filterCreator" placeholder="username">
                    </div>
                    <div class="filter-buttons">
                        <button type="submit">Apply Filters</button>
                        <button type="button" id="clearFiltersBtn">Clear Filters</button>
                        <button type="button" onclick="document.getElementById('filterModal').classList.remove('show')">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set up filter form handlers
        const credibilitySlider = document.getElementById('minCredibility');
        const credibilityValue = document.getElementById('credibilityValue');
        
        credibilitySlider.addEventListener('input', (e) => {
            credibilityValue.textContent = e.target.value;
        });
        
        document.getElementById('filterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyFilters();
        });
        
        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
            document.getElementById('filterModal').classList.remove('show');
        });
    }
    
    getActiveFilters() {
        const filters = {};
        
        if (document.getElementById('minCredibility')) {
            const minCred = parseInt(document.getElementById('minCredibility').value);
            console.log('Credibility filter value:', minCred);
            if (minCred > 0) {
                filters.minCredibility = minCred;
            }
        }
        
        if (document.getElementById('filterTags')) {
            const tags = document.getElementById('filterTags').value.trim();
            console.log('Tags filter value:', tags);
            if (tags) {
                filters.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
        }
        
        if (document.getElementById('filterCreator')) {
            const creator = document.getElementById('filterCreator').value.trim();
            console.log('Creator filter value:', creator);
            if (creator) {
                filters.creator = creator;
            }
        }
        
        console.log('Active filters:', filters);
        return filters;
    }
    
    applyFilters() {
        // Close filter modal
        document.getElementById('filterModal').classList.remove('show');
        
        // Get active filters
        const filters = this.getActiveFilters();
        
        // If there's a search query, re-run search with filters
        const searchInput = document.getElementById('mindmap-search');
        if (searchInput.value.trim()) {
            this.performSearch(searchInput.value);
            return;
        }
        
        // If no search query, apply visual filters to current view
        this.applyVisualFilters(filters);
    }
    
    applyVisualFilters(filters) {
        const cy = window.nexusEngine?.cy;
        if (!cy) {
            console.error('Cytoscape instance not found');
            return;
        }
        
        console.log('Applying visual filters:', filters);
        
        // Get all nodes
        const nodes = cy.nodes();
        let filteredCount = 0;
        let totalCount = nodes.length;
        
        console.log(`Processing ${totalCount} nodes`);
        
        nodes.forEach(node => {
            let visible = true;
            const nodeData = node.data();
            
            // Debug: Log first node data structure
            if (filteredCount === 0) {
                console.log('Sample node data:', nodeData);
            }
            
            // Check credibility filter - handle different data structures
            if (filters.minCredibility) {
                const credibility = nodeData.credibility?.score || nodeData.credibility || 50;
                console.log(`Node ${nodeData.id} credibility: ${credibility}, required: ${filters.minCredibility}`);
                if (credibility < filters.minCredibility) {
                    visible = false;
                    console.log(`Filtering out node ${nodeData.id} due to low credibility`);
                }
            }
            
            // Check tags filter
            if (filters.tags && filters.tags.length > 0) {
                const nodeTags = nodeData.tags || [];
                console.log(`Node ${nodeData.id} tags:`, nodeTags, 'Required tags:', filters.tags);
                const hasMatchingTag = filters.tags.some(filterTag => 
                    nodeTags.some(nodeTag => 
                        nodeTag.toLowerCase().includes(filterTag.toLowerCase())
                    )
                );
                if (!hasMatchingTag) {
                    visible = false;
                    console.log(`Filtering out node ${nodeData.id} due to tag mismatch`);
                }
            }
            
            // Check creator filter
            if (filters.creator) {
                const creator = nodeData.creator?.username || nodeData.creator || '';
                console.log(`Node ${nodeData.id} creator: ${creator}, required: ${filters.creator}`);
                if (!creator.toLowerCase().includes(filters.creator.toLowerCase())) {
                    visible = false;
                    console.log(`Filtering out node ${nodeData.id} due to creator mismatch`);
                }
            }
            
            // Apply visibility
            if (visible) {
                node.removeClass('filtered-out');
                node.style('opacity', 1);
            } else {
                node.addClass('filtered-out');
                node.style('opacity', 0.2);
                filteredCount++;
            }
        });
        
        // Also filter edges connected to hidden nodes
        const edges = cy.edges();
        edges.forEach(edge => {
            const source = edge.source();
            const target = edge.target();
            
            if (source.hasClass('filtered-out') || target.hasClass('filtered-out')) {
                edge.style('opacity', 0.1);
            } else {
                edge.style('opacity', 1);
            }
        });
        
        console.log(`Visual filters applied: ${filteredCount}/${totalCount} nodes filtered out`);
        
        // Show feedback to user
        if (filteredCount > 0) {
            console.log(`Filter applied: ${totalCount - filteredCount} nodes visible, ${filteredCount} nodes hidden`);
        } else {
            console.log('No nodes were filtered out - all nodes remain visible');
        }
    }
    
    clearFilters() {
        const cy = window.nexusEngine?.cy;
        if (!cy) return;
        
        // Reset all nodes and edges to visible
        cy.nodes().removeClass('filtered-out').style('opacity', 1);
        cy.edges().style('opacity', 1);
        
        // Reset filter form
        if (document.getElementById('minCredibility')) {
            document.getElementById('minCredibility').value = 0;
            document.getElementById('credibilityValue').textContent = '0';
        }
        if (document.getElementById('filterTags')) {
            document.getElementById('filterTags').value = '';
        }
        if (document.getElementById('filterCreator')) {
            document.getElementById('filterCreator').value = '';
        }
        
        console.log('Filters cleared');
    }
    
    // Test function to verify filtering works
    testFiltering() {
        console.log('Testing filter functionality...');
        const cy = window.nexusEngine?.cy;
        if (!cy) {
            console.log('Cytoscape not ready for testing');
            return;
        }
        
        const nodes = cy.nodes();
        console.log(`Found ${nodes.length} nodes for testing`);
        
        // Test with high credibility to see if any nodes get hidden
        this.applyVisualFilters({ minCredibility: 80 });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        console.error(message);
        // Could be enhanced with a toast notification
    }
}

// Initialize when nexusEngine is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for nexusEngine to be initialized
    const checkNexusEngine = setInterval(() => {
        if (window.nexusEngine) {
            clearInterval(checkNexusEngine);
            window.mindmapSearch = new MindmapSearch(window.nexusEngine);
        }
    }, 100);
}); 