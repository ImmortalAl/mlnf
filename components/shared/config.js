// MLNF Configuration File

// Prevent redeclaration errors if script is loaded multiple times
if (typeof window.MLNF_CONFIG === 'undefined') {
    // Check if we're in development mode (local development)
    const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocalDevelopment ? 'http://localhost:3001/api' : 'https://mlnf-auth.onrender.com/api';
    const DEFAULT_AVATAR = '/assets/images/default.jpg';
     
    // Expose these on a global MLNF object
    window.MLNF_CONFIG = {
        API_BASE_URL: API_BASE_URL,
        DEFAULT_AVATAR: DEFAULT_AVATAR
    };
} 