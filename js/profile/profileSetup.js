// Profile Setup JavaScript
// Handles the profile setup form functionality

document.addEventListener('DOMContentLoaded', function() {
    
    // Get form elements
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('displayName');
    const avatarInput = document.getElementById('avatar');
    const avatarPreview = document.getElementById('avatarPreview');
    const statusInput = document.getElementById('status');
    const bioInput = document.getElementById('bio');
    const signatureInput = document.getElementById('signature');
    const saveButton = document.getElementById('saveProfile');
    const messageElement = document.getElementById('message');

    // Load existing profile data if user is already logged in
    loadExistingProfile();

    // Avatar preview functionality
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('input', function() {
            const avatarUrl = this.value.trim();
            if (avatarUrl && isValidUrl(avatarUrl)) {
                avatarPreview.src = avatarUrl;
                avatarPreview.onerror = function() {
                    this.src = '../assets/images/default.jpg';
                    showMessage('Invalid avatar URL. Using default avatar.', 'warning');
                };
            } else {
                avatarPreview.src = '../assets/images/default.jpg';
            }
        });
    }

    // Form submission
    if (saveButton) {
        saveButton.addEventListener('click', handleProfileSave);
    }

    // Real-time validation
    if (usernameInput) {
        usernameInput.addEventListener('input', validateUsername);
    }

    async function loadExistingProfile() {
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) {
                return;
            }

            const apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
            const response = await fetch(`${apiBaseUrl}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                populateForm(userData);
            }
        } catch (error) {
            console.log('Could not load existing profile:', error);
        }
    }

    function populateForm(userData) {
        if (userData.username && usernameInput) {
            usernameInput.value = userData.username;
        }
        if (userData.displayName && displayNameInput) {
            displayNameInput.value = userData.displayName;
        }
        if (userData.avatar && avatarInput) {
            avatarInput.value = userData.avatar;
            avatarPreview.src = userData.avatar;
        }
        if (userData.status && statusInput) {
            statusInput.value = userData.status;
        }
        if (userData.bio && bioInput) {
            bioInput.value = userData.bio;
        }
        if (userData.signature && signatureInput) {
            signatureInput.value = userData.signature;
        }
    }

    async function handleProfileSave(event) {
        event.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Disable button during save
        saveButton.disabled = true;
        saveButton.textContent = 'Ascending...';

        try {
            const profileData = {
                username: usernameInput.value.trim(),
                displayName: displayNameInput.value.trim() || null,
                avatar: avatarInput.value.trim() || null,
                status: statusInput.value.trim() || null,
                bio: bioInput.value.trim() || null,
                signature: signatureInput.value.trim() || null
            };

            const token = localStorage.getItem('sessionToken');
            if (!token) {
                throw new Error('Please log in to save your profile');
            }

            const apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
            const response = await fetch(`${apiBaseUrl}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save profile');
            }

            showMessage('Profile saved successfully! Welcome to eternity.', 'success');
            
            // Redirect to profile page after successful save
            setTimeout(() => {
                window.location.href = '../profile/index.html';
            }, 2000);

        } catch (error) {
            console.error('Error saving profile:', error);
            showMessage(error.message, 'error');
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Ascend to Eternity';
        }
    }

    function validateForm() {
        let isValid = true;

        // Username is required
        if (!usernameInput.value.trim()) {
            showMessage('Username is required', 'error');
            usernameInput.focus();
            return false;
        }

        // Username length validation
        const username = usernameInput.value.trim();
        if (username.length < 3 || username.length > 30) {
            showMessage('Username must be between 3 and 30 characters', 'error');
            usernameInput.focus();
            return false;
        }

        // Username format validation
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            showMessage('Username can only contain letters, numbers, underscores, and hyphens', 'error');
            usernameInput.focus();
            return false;
        }

        // Avatar URL validation
        const avatarUrl = avatarInput.value.trim();
        if (avatarUrl && !isValidUrl(avatarUrl)) {
            showMessage('Please enter a valid avatar URL', 'error');
            avatarInput.focus();
            return false;
        }

        // Bio length validation
        if (bioInput.value.length > 500) {
            showMessage('Bio must be less than 500 characters', 'error');
            bioInput.focus();
            return false;
        }

        // Status length validation
        if (statusInput.value.length > 100) {
            showMessage('Status must be less than 100 characters', 'error');
            statusInput.focus();
            return false;
        }

        // Signature length validation
        if (signatureInput.value.length > 150) {
            showMessage('Signature must be less than 150 characters', 'error');
            signatureInput.focus();
            return false;
        }

        return isValid;
    }

    function validateUsername() {
        const username = usernameInput.value.trim();
        
        if (username.length === 0) {
            clearMessage();
            return;
        }

        if (username.length < 3) {
            showMessage('Username must be at least 3 characters', 'warning');
            return;
        }

        if (username.length > 30) {
            showMessage('Username cannot exceed 30 characters', 'warning');
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            showMessage('Username can only contain letters, numbers, underscores, and hyphens', 'warning');
            return;
        }

        clearMessage();
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function showMessage(text, type = 'info') {
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = `message ${type}`;
            messageElement.style.display = 'block';
        }
    }

    function clearMessage() {
        if (messageElement) {
            messageElement.style.display = 'none';
            messageElement.textContent = '';
        }
    }
}); 