// MLNF Auth Manager
// A centralized module for managing user authentication state.

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('sessionToken') || null;
        this._subscribers = [];
        // Delay initialization to ensure dependencies are loaded
        this._initializeWhenReady();
    }

    /**
     * Wait for dependencies and then initialize
     */
    async _initializeWhenReady() {
        // Wait for apiClient to be available
        const checkApiClient = () => {
            return new Promise((resolve) => {
                if (window.apiClient) {
                    resolve();
                } else {
                    setTimeout(() => checkApiClient().then(resolve), 100);
                }
            });
        };
        
        await checkApiClient();
        await this.initialize();
    }

    /**
     * Subscribe to authentication state changes.
     * @param {function} callback - The function to call when auth state changes.
     */
    subscribe(callback) {
        this._subscribers.push(callback);
        // Immediately notify the new subscriber with the current state
        callback(this.isLoggedIn(), this.currentUser);
    }

    /**
     * Notify all subscribers of an auth state change.
     */
    _notify() {
        for (const callback of this._subscribers) {
            try {
                callback(this.isLoggedIn(), this.currentUser);
            } catch (error) {
                console.error("Error in auth subscriber:", error);
            }
        }
    }

    /**
     * Checks the validity of the current token and fetches user data.
     */
    async initialize() {
        if (!this.token) {
            this.currentUser = null;
            this._notify();
            return;
        }

        // Don't initialize if apiClient isn't available yet
        if (!window.apiClient) {
            console.warn('[AuthManager] apiClient not available yet, delaying initialization');
            return;
        }

        try {
            // Use the global apiClient to verify the user
            const user = await window.apiClient.get('/users/me');
            this.currentUser = user;
        } catch (error) {
            console.warn('[AuthManager] Token verification failed:', error);
            // Only logout if it's specifically a 401 Unauthorized error
            if (error.error && error.error.includes('401') || error.status === 401) {
                console.warn('[AuthManager] Token is invalid or expired. Clearing session.');
                this.logout();
            } else {
                console.warn('[AuthManager] API error during initialization, keeping session for now:', error);
                // For network errors or server issues, don't automatically logout
                // Just set currentUser to null but keep the token
                this.currentUser = null;
            }
            return;
        }
        
        this._notify(); // Notify subscribers that user is logged in
    }

    /**
     * Checks if a user is currently logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!this.currentUser && !!this.token;
    }

    /**
     * Returns the current user's data.
     * @returns {object|null}
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Returns the current session token.
     * @returns {string|null}
     */
    getToken() {
        return this.token;
    }
    
    /**
     * Handles the login process, storing the token and user data.
     * @param {string} token - The session token.
     * @param {object} user - The user data object.
     */
    login(token, user) {
        localStorage.setItem('sessionToken', token);
        this.token = token;
        this.currentUser = user;
        this._notify();
    }

    /**
     * Handles the logout process, clearing all session data.
     */
    logout() {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user'); // Also clear cached user data
        this.token = null;
        this.currentUser = null;
        this._notify();
    }

    /**
     * Show login modal (for compatibility with apiClient)
     */
    showLogin() {
        if (window.MLNF && window.MLNF.openSoulModal) {
            window.MLNF.openSoulModal('login');
        } else {
            console.warn('[AuthManager] Cannot show login modal - openSoulModal not available');
        }
    }
}

// Make a single instance globally available
window.authManager = new AuthManager(); 