/**
 * MLNF Authentication Handler
 * Handles user authentication state across all pages
 */

(function() {
    'use strict';
    
    // Initialize auth state on page load
    async function initAuth() {
        const token = localStorage.getItem('mlnf_token');
        const user = localStorage.getItem('mlnf_user');
        
        if (token && user) {
            const userData = JSON.parse(user);
            
            // Validate token with backend if on protected pages
            const protectedPages = ['dashboard.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                const isValid = await validateToken(token);
                if (!isValid) {
                    console.log('⚠️ Token validation failed, redirecting to login');
                    clearAuthAndRedirect();
                    return;
                }
            }
            
            updateUIForLoggedInUser(userData);
        } else {
            updateUIForLoggedOutUser();
        }
    }
    
    // Validate token with backend
    async function validateToken(token) {
        // Local tokens are only valid if we're truly offline
        // If we can reach the server, we should validate properly
        if (token.startsWith('local_')) {
            console.log('⚠️ Local token detected - checking if we can reach server...');
            try {
                const testResponse = await fetch(getAPIBaseURL() + '/health', { method: 'GET' });
                if (testResponse.ok) {
                    // Server is reachable, local token is not valid
                    console.log('❌ Server reachable but using local token - clearing session');
                    return false;
                }
            } catch (e) {
                // Server not reachable, allow local token for offline mode
                console.log('✅ Server unreachable - allowing local token for offline mode');
                return true;
            }
        }

        try {
            // Get API URL based on environment
            const API_BASE_URL = getAPIBaseURL();
            
            console.log('🔍 Validating token with:', API_BASE_URL);
            
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('📡 Token validation response:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                // Update user data in localStorage with fresh data from backend
                if (data.user) {
                    localStorage.setItem('mlnf_user', JSON.stringify(data.user));
                }
                console.log('✅ Token validated successfully');
                return true;
            } else if (response.status === 401) {
                // Only clear token on 401 Unauthorized (expired/invalid token)
                console.log('❌ Token validation failed: 401 Unauthorized');
                return false;
            } else {
                // For other errors (500, 503, etc), assume token is valid
                console.log('⚠️ Backend returned', response.status, '- assuming token valid');
                return true;
            }
        } catch (error) {
            console.error('❌ Token validation error:', error);
            // If backend is unreachable, allow access (offline mode)
            // This prevents breaking the app when backend is down
            console.log('⚠️ Backend unreachable, allowing offline access');
            return true;
        }
    }
    
    // Get API Base URL based on environment
    function getAPIBaseURL() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('netlify.app') || hostname.includes('mlnf.net') || hostname.includes('vercel.app')) {
            return 'https://much-love-no-fear.onrender.com/api';
        }
        
        if (hostname.includes('sandbox.novita.ai') || hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        
        return 'https://much-love-no-fear.onrender.com/api';
    }
    
    // Clear authentication and redirect to login
    function clearAuthAndRedirect() {
        localStorage.removeItem('mlnf_token');
        localStorage.removeItem('mlnf_user');
        showNotification('Session expired. Please login again.', 'error');
        
        setTimeout(() => {
            const isInSubdir = window.location.pathname.includes('/pages/');
            window.location.href = isInSubdir ? 'auth.html' : 'pages/auth.html';
        }, 1000);
    }
    
    // Update UI for logged-in users
    function updateUIForLoggedInUser(user) {
        // Update navigation
        const authLink = document.getElementById('authLink');
        const dashboardLink = document.getElementById('dashboardLink');
        const notificationBell = document.getElementById('notificationBell');
        const runegoldDisplay = document.getElementById('runegoldDisplay');
        const runegoldAmount = document.getElementById('runegoldAmount');
        
        if (authLink) {
            authLink.textContent = 'Logout';
            authLink.href = '#';
            authLink.classList.remove('hidden');
            authLink.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
        
        if (dashboardLink) {
            dashboardLink.classList.remove('hidden');
            // Make sure dashboard link points to correct location
            const isInSubdir = window.location.pathname.includes('/pages/');
            if (isInSubdir && !dashboardLink.href.includes('..')) {
                dashboardLink.href = '../dashboard.html';
            }
        }
        
        if (notificationBell) {
            notificationBell.classList.remove('hidden');
        }
        
        if (runegoldDisplay) {
            runegoldDisplay.classList.remove('hidden');
        }
        
        if (runegoldAmount) {
            runegoldAmount.textContent = formatNumber(user.runegoldBalance || 100);
        }
        
        // Update dashboard specific elements
        updateDashboardUser(user);
    }
    
    // Update UI for logged-out users
    function updateUIForLoggedOutUser() {
        const authLink = document.getElementById('authLink');
        const dashboardLink = document.getElementById('dashboardLink');
        const notificationBell = document.getElementById('notificationBell');
        const runegoldDisplay = document.getElementById('runegoldDisplay');
        
        if (authLink) {
            authLink.textContent = 'Login';
            // Detect if we're in a subdirectory
            const isInSubdir = window.location.pathname.includes('/pages/');
            authLink.href = isInSubdir ? 'auth.html' : 'pages/auth.html';
            authLink.onclick = null;
        }
        
        if (dashboardLink) {
            dashboardLink.classList.add('hidden');
        }
        
        if (notificationBell) {
            notificationBell.classList.add('hidden');
        }
        
        if (runegoldDisplay) {
            runegoldDisplay.classList.add('hidden');
        }
    }
    
    // Update dashboard page with user info
    function updateDashboardUser(user) {
        // Update username displays
        const usernameElements = document.querySelectorAll('.user-name, .username-display');
        usernameElements.forEach(el => {
            el.textContent = user.username || 'User';
        });
        
        // Update badge
        const badgeElement = document.querySelector('.user-badge, .badge-gold');
        if (badgeElement) {
            const runegold = user.runegoldBalance || 0;
            if (runegold >= 1000) {
                badgeElement.textContent = 'Viking Champion';
            } else if (runegold >= 500) {
                badgeElement.textContent = 'Truth Warrior';
            } else {
                badgeElement.textContent = 'New Viking';
            }
        }
        
        // Update all runegold displays
        const runegoldElements = document.querySelectorAll('.runegold-balance, .runegold-amount');
        runegoldElements.forEach(el => {
            el.textContent = formatNumber(user.runegoldBalance || 100);
        });
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem('mlnf_token');
        localStorage.removeItem('mlnf_user');
        
        // Show notification
        showNotification('Logged out successfully', 'info');
        
        // Redirect to home
        setTimeout(() => {
            const isInSubdir = window.location.pathname.includes('/pages/');
            window.location.href = isInSubdir ? '../index.html' : 'index.html';
        }, 500);
    }
    
    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Protect pages that require authentication
    function protectPage() {
        const token = localStorage.getItem('mlnf_token');
        const protectedPages = ['dashboard.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage) && !token) {
            showNotification('Please login to access this page', 'error');
            setTimeout(() => {
                // Dashboard is in root, so always use pages/auth.html
                window.location.href = 'pages/auth.html';
            }, 1000);
        }
    }
    
    // Initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initAuth();
            protectPage();
        });
    } else {
        initAuth();
        protectPage();
    }
    
    // Export functions for global use
    window.MLNFAuth = {
        logout: logout,
        getUser: function() {
            const user = localStorage.getItem('mlnf_user');
            return user ? JSON.parse(user) : null;
        },
        isLoggedIn: function() {
            return !!localStorage.getItem('mlnf_token');
        }
    };
    
})();
