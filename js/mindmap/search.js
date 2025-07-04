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
        
        document.getElementById('filterModal').style.display = 'block';
    }
    
    createFilterModal() {
        const modal = document.createElement('div');
        modal.id = 'filterModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.style.display='none'">×</span>
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
                    <button type="submit">Apply Filters</button>
                    <button type="button" onclick="document.getElementById('filterModal').style.display='none'">Cancel</button>
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
    }
    
    getActiveFilters() {
        const filters = {};
        
        if (document.getElementById('minCredibility')) {
            const minCred = parseInt(document.getElementById('minCredibility').value);
            if (minCred > 0) {
                filters.minCredibility = minCred;
            }
        }
        
        if (document.getElementById('filterTags')) {
            const tags = document.getElementById('filterTags').value.trim();
            if (tags) {
                filters.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
        }
        
        if (document.getElementById('filterCreator')) {
            const creator = document.getElementById('filterCreator').value.trim();
            if (creator) {
                filters.creator = creator;
            }
        }
        
        return filters;
    }
    
    applyFilters() {
        // Close filter modal
        document.getElementById('filterModal').style.display = 'none';
        
        // Re-run search with filters
        const searchInput = document.getElementById('mindmap-search');
        this.performSearch(searchInput.value);
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