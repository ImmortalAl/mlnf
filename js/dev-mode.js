/**
 * MLNF Development Mode Manager
 * =============================
 * This file helps you easily switch between local and production APIs
 * 
 * HOW TO USE:
 * 1. Include this script in your HTML: <script src="/js/dev-mode.js"></script>
 * 2. Press Ctrl+Shift+D to toggle dev mode
 * 3. Or use the floating dev button in the bottom-right corner
 */

(function() {
    'use strict';
    
    // Configuration
    const DEV_CONFIG = {
        localAPI: 'http://localhost:3001/api',
        productionAPI: 'https://mlnf-auth.onrender.com/api',
        storageKey: 'mlnf_dev_mode',
        debugKey: 'mlnf_debug'
    };
    
    // Dev Mode State
    let devMode = {
        enabled: false,
        apiUrl: DEV_CONFIG.productionAPI,
        debug: false,
        mockAuth: false
    };
    
    // Initialize from localStorage
    function init() {
        const saved = localStorage.getItem(DEV_CONFIG.storageKey);
        if (saved) {
            try {
                devMode = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse dev mode settings:', e);
            }
        }
        applyDevMode();
        createDevUI();
        setupKeyboardShortcuts();
    }
    
    // Apply dev mode settings
    function applyDevMode() {
        // Update global config
        if (window.MLNF_CONFIG) {
            window.MLNF_CONFIG.API_BASE_URL = devMode.apiUrl;
        }
        
        // Add visual indicator
        if (devMode.enabled) {
            document.body.classList.add('dev-mode');
            console.log(`🚀 DEV MODE ACTIVE - API: ${devMode.apiUrl}`);
        } else {
            document.body.classList.remove('dev-mode');
            console.log(`🌐 PRODUCTION MODE - API: ${devMode.apiUrl}`);
        }
        
        // Save to localStorage
        localStorage.setItem(DEV_CONFIG.storageKey, JSON.stringify(devMode));
    }
    
    // Create floating dev UI
    function createDevUI() {
        // Remove existing UI if any
        const existing = document.getElementById('dev-mode-ui');
        if (existing) existing.remove();
        
        // Create container
        const ui = document.createElement('div');
        ui.id = 'dev-mode-ui';
        ui.innerHTML = `
            <button id="dev-toggle-btn" title="Toggle Dev Mode (Ctrl+Shift+D)">
                <span class="dev-icon">🛠️</span>
                <span class="dev-text">${devMode.enabled ? 'DEV' : 'PROD'}</span>
            </button>
            <div id="dev-panel" class="hidden">
                <h3>Development Settings</h3>
                <div class="dev-option">
                    <label>
                        <input type="checkbox" id="dev-enabled" ${devMode.enabled ? 'checked' : ''}>
                        Enable Dev Mode
                    </label>
                </div>
                <div class="dev-option">
                    <label>API Endpoint:</label>
                    <select id="dev-api-select">
                        <option value="${DEV_CONFIG.productionAPI}" ${devMode.apiUrl === DEV_CONFIG.productionAPI ? 'selected' : ''}>
                            Production (Render)
                        </option>
                        <option value="${DEV_CONFIG.localAPI}" ${devMode.apiUrl === DEV_CONFIG.localAPI ? 'selected' : ''}>
                            Local (localhost:3001)
                        </option>
                        <option value="custom">Custom URL...</option>
                    </select>
                    <input type="text" id="dev-custom-api" placeholder="Enter custom API URL" 
                           value="${devMode.apiUrl}" style="display: none; margin-top: 5px;">
                </div>
                <div class="dev-option">
                    <label>
                        <input type="checkbox" id="dev-debug" ${devMode.debug ? 'checked' : ''}>
                        Enable Debug Logging
                    </label>
                </div>
                <div class="dev-option">
                    <label>
                        <input type="checkbox" id="dev-mock-auth" ${devMode.mockAuth ? 'checked' : ''}>
                        Mock Authentication (skip login)
                    </label>
                </div>
                <div class="dev-actions">
                    <button id="dev-save">Save</button>
                    <button id="dev-reset">Reset</button>
                    <button id="dev-close">Close</button>
                </div>
                <div class="dev-info">
                    <p><strong>Current API:</strong> <code>${devMode.apiUrl}</code></p>
                    <p><strong>Status:</strong> <span id="dev-status">Checking...</span></p>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #dev-mode-ui {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: 'Courier New', monospace;
            }
            
            #dev-toggle-btn {
                background: ${devMode.enabled ? '#ff5e78' : '#1a1a33'};
                color: white;
                border: 2px solid #FFD700;
                border-radius: 50px;
                padding: 10px 20px;
                cursor: pointer;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            #dev-toggle-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 12px rgba(0,0,0,0.4);
            }
            
            .dev-icon {
                font-size: 20px;
            }
            
            #dev-panel {
                position: absolute;
                bottom: 60px;
                right: 0;
                background: #1a1a33;
                border: 2px solid #FFD700;
                border-radius: 12px;
                padding: 20px;
                min-width: 300px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.4);
                color: #f0e6ff;
            }
            
            #dev-panel.hidden {
                display: none;
            }
            
            #dev-panel h3 {
                margin: 0 0 15px 0;
                color: #FFD700;
                border-bottom: 1px solid #FFD700;
                padding-bottom: 10px;
            }
            
            .dev-option {
                margin: 10px 0;
            }
            
            .dev-option label {
                display: block;
                margin-bottom: 5px;
                color: #f0e6ff;
            }
            
            .dev-option input[type="checkbox"] {
                margin-right: 8px;
            }
            
            .dev-option select,
            .dev-option input[type="text"] {
                width: 100%;
                padding: 5px;
                background: #0d0d1a;
                border: 1px solid #2a4066;
                color: #f0e6ff;
                border-radius: 4px;
            }
            
            .dev-actions {
                margin-top: 15px;
                display: flex;
                gap: 10px;
            }
            
            .dev-actions button {
                flex: 1;
                padding: 8px;
                background: #ff5e78;
                color: #0d0d1a;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .dev-actions button:hover {
                background: #FFD700;
            }
            
            .dev-info {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #2a4066;
                font-size: 12px;
            }
            
            .dev-info p {
                margin: 5px 0;
            }
            
            .dev-info code {
                background: #0d0d1a;
                padding: 2px 5px;
                border-radius: 3px;
                color: #ff5e78;
            }
            
            body.dev-mode::before {
                content: "DEV MODE";
                position: fixed;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                background: #ff5e78;
                color: white;
                padding: 5px 20px;
                font-weight: bold;
                z-index: 10001;
                border-radius: 0 0 10px 10px;
                font-family: 'Courier New', monospace;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(ui);
        
        // Setup event listeners
        setupUIEvents();
        
        // Check API status
        checkAPIStatus();
    }
    
    // Setup UI event listeners
    function setupUIEvents() {
        const toggleBtn = document.getElementById('dev-toggle-btn');
        const panel = document.getElementById('dev-panel');
        const enabledCheckbox = document.getElementById('dev-enabled');
        const apiSelect = document.getElementById('dev-api-select');
        const customApiInput = document.getElementById('dev-custom-api');
        const debugCheckbox = document.getElementById('dev-debug');
        const mockAuthCheckbox = document.getElementById('dev-mock-auth');
        const saveBtn = document.getElementById('dev-save');
        const resetBtn = document.getElementById('dev-reset');
        const closeBtn = document.getElementById('dev-close');
        
        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('hidden');
        });
        
        // API select change
        apiSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customApiInput.style.display = 'block';
            } else {
                customApiInput.style.display = 'none';
                customApiInput.value = e.target.value;
            }
        });
        
        // Save settings
        saveBtn.addEventListener('click', () => {
            devMode.enabled = enabledCheckbox.checked;
            devMode.apiUrl = apiSelect.value === 'custom' ? customApiInput.value : apiSelect.value;
            devMode.debug = debugCheckbox.checked;
            devMode.mockAuth = mockAuthCheckbox.checked;
            
            applyDevMode();
            toggleBtn.querySelector('.dev-text').textContent = devMode.enabled ? 'DEV' : 'PROD';
            toggleBtn.style.background = devMode.enabled ? '#ff5e78' : '#1a1a33';
            
            alert('Dev settings saved! Page will reload to apply changes.');
            location.reload();
        });
        
        // Reset settings
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all dev settings to default?')) {
                localStorage.removeItem(DEV_CONFIG.storageKey);
                location.reload();
            }
        });
        
        // Close panel
        closeBtn.addEventListener('click', () => {
            panel.classList.add('hidden');
        });
    }
    
    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D to toggle dev mode
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                devMode.enabled = !devMode.enabled;
                devMode.apiUrl = devMode.enabled ? DEV_CONFIG.localAPI : DEV_CONFIG.productionAPI;
                applyDevMode();
                location.reload();
            }
            
            // Ctrl+Shift+L to toggle debug logging
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                devMode.debug = !devMode.debug;
                applyDevMode();
                console.log(`Debug logging: ${devMode.debug ? 'ON' : 'OFF'}`);
            }
        });
    }
    
    // Check API status
    async function checkAPIStatus() {
        const statusEl = document.getElementById('dev-status');
        if (!statusEl) return;
        
        try {
            const response = await fetch(devMode.apiUrl + '/ping');
            if (response.ok) {
                statusEl.innerHTML = '<span style="color: #5cb85c;">✓ Connected</span>';
            } else {
                statusEl.innerHTML = '<span style="color: #d9534f;">✗ Error: ' + response.status + '</span>';
            }
        } catch (error) {
            statusEl.innerHTML = '<span style="color: #d9534f;">✗ Offline</span>';
        }
    }
    
    // Enhanced console logging for debug mode
    if (devMode.debug) {
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = function(...args) {
            originalLog.apply(console, ['[MLNF DEBUG]', ...args]);
        };
        
        console.error = function(...args) {
            originalError.apply(console, ['[MLNF ERROR]', ...args]);
        };
    }
    
    // Mock authentication helper
    window.MLNFDevMode = {
        getConfig: () => devMode,
        setMockUser: (user) => {
            if (devMode.mockAuth) {
                localStorage.setItem('sessionToken', 'mock-token-12345');
                localStorage.setItem('user', JSON.stringify({
                    id: 'mock-user-id',
                    username: user || 'DevUser',
                    displayName: user || 'Development User',
                    avatar: '/assets/images/default.jpg'
                }));
                console.log('Mock user set:', user || 'DevUser');
            }
        },
        clearMockUser: () => {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('user');
            console.log('Mock user cleared');
        }
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 