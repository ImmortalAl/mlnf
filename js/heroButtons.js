// Hero Button Handlers
// Manages authentication state and button behavior in the hero section

document.addEventListener('DOMContentLoaded', function() {
    const heroSignupButton = document.getElementById('heroSignupButton');
    const heroLoginButton = document.getElementById('heroLoginButton');
    
    // Check if user is logged in
    const token = localStorage.getItem('sessionToken');
    
    if (token) {
        // User is logged in - update buttons to be proper links
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (heroSignupButton && heroLoginButton) {
                // Hide the signup button since profile is now integrated with Eternal Hearth
                heroSignupButton.style.display = 'none';
                
                heroLoginButton.textContent = 'Enter Eternal Hearth';
                heroLoginButton.href = '/lander.html';
                
                // Remove any existing event listeners by cloning and replacing the login button
                const newLoginButton = heroLoginButton.cloneNode(true);
                heroLoginButton.parentNode.replaceChild(newLoginButton, heroLoginButton);
            }
        } catch (error) {
            // Error parsing user data - silently continue
            console.warn('Error parsing user data:', error);
        }
    } else {
        // User is not logged in - add modal event listeners
        if (heroSignupButton) {
            heroSignupButton.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.MLNF && window.MLNF.openSoulModal) {
                    window.MLNF.openSoulModal('register');
                }
            });
        }
        
        if (heroLoginButton) {
            heroLoginButton.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.MLNF && window.MLNF.openSoulModal) {
                    window.MLNF.openSoulModal('login');
                }
            });
        }
    }
    
    // Active users sidebar toggle is handled by components/shared/activeUsers.js
    // Message modal close is handled by components/shared/messageModal.js
});