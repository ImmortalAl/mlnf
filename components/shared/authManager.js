// MLNF Auth Manager
// A centralized module for managing user authentication state.

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('sessionToken') || null;
        this._subscribers = [];
        this.initialize();
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

        try {
            // Use the global apiClient to verify the user
            const user = await window.apiClient.get('/users/me');
            this.currentUser = user;
        } catch (error) {
            console.warn('[AuthManager] Token is invalid or expired. Clearing session.');
            this.logout(); // This will clear the token and user data
            // No need to notify here, logout() already does it.
            return; // Exit early
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
        this.token = null;
        this.currentUser = null;
        this._notify();
    }
}

// Make a single instance globally available
window.authManager = new AuthManager(); 