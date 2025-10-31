/**
 * MLNF Authentication Handler
 * Handles user authentication state across all pages
 */

(function() {
    'use strict';
    
    // Initialize auth state on page load
    function initAuth() {
        const token = localStorage.getItem('mlnf_token');
        const user = localStorage.getItem('mlnf_user');
        
        if (token && user) {
            const userData = JSON.parse(user);
            updateUIForLoggedInUser(userData);
        } else {
            updateUIForLoggedOutUser();
        }
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
            authLink.href = 'pages/auth.html';
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
            window.location.href = '/index.html';
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
