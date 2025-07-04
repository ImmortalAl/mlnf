// MLNF API Client
// A centralized module for handling all communication with the backend API.

const getAuthToken = () => {
    return localStorage.getItem('sessionToken');
};

const apiClient = {
    /**
     * The base URL for all API requests.
     */
    baseURL: window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api',

    /**
     * Performs a GET request.
     * @param {string} endpoint - The API endpoint to hit (e.g., '/chronicles').
     * @returns {Promise<any>} The JSON response from the server.
     */
    async get(endpoint) {
        return this.request('GET', endpoint);
    },

    /**
     * Performs a POST request.
     * @param {string} endpoint - The API endpoint to hit.
     * @param {object} body - The data to send in the request body.
     * @returns {Promise<any>} The JSON response from the server.
     */
    async post(endpoint, body) {
        return this.request('POST', endpoint, body);
    },
    
    /**
     * Performs a PUT request.
     * @param {string} endpoint - The API endpoint to hit.
     * @param {object} body - The data to send in the request body.
     * @returns {Promise<any>} The JSON response from the server.
     */
    async put(endpoint, body) {
        return this.request('PUT', endpoint, body);
    },

    /**
     * Performs a DELETE request.
     * @param {string} endpoint - The API endpoint to hit.
     * @returns {Promise<any>} The JSON response from the server.
     */
    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    },

    /**
     * The core request handling function.
     * @param {string} method - The HTTP method (GET, POST, etc.).
     * @param {string} endpoint - The API endpoint.
     * @param {object} [body] - The request body for POST/PUT requests.
     * @returns {Promise<any>} The JSON response from the server.
     */
    async request(method, endpoint, body = null) {
        const url = `${this.baseURL}${endpoint}`;
        const token = getAuthToken();

        const headers = new Headers({
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
            // 'Expires': '0' // Temporarily disabled due to 502 backend issues
        });

        // Skip auth headers for GET /threads since it doesn't require authentication
        const skipAuth = method === 'GET' && endpoint === '/threads';
        if (token && !skipAuth) {
            headers.append('Authorization', `Bearer ${token}`);
        }

        // Debug logging removed for cleaner console output

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }
        
        // Request logging removed for cleaner console output

        try {
            const response = await fetch(url, config);

            // Handle cases where the response is not OK
            if (!response.ok) {
                let errorData;
                try {
                    // Try to parse the error response from the server
                    errorData = await response.json();
                    console.error(`[API Client] Error Response (${response.status}):`, errorData);
                } catch (e) {
                    // If the error response isn't valid JSON
                    errorData = { error: `HTTP error! Status: ${response.status}`, details: await response.text() };
                     console.error(`[API Client] Non-JSON Error Response (${response.status}):`, errorData.details);
                }
                
                // Specific handling for 401 Unauthorized
                if (response.status === 401 && window.authManager) {
                     console.warn('[API Client] Unauthorized access detected. Requesting login.');
                     window.authManager.showLogin();
                }

                // Create an error object with the response data and status
                const error = new Error(errorData.error || 'Request failed');
                error.response = {
                    data: errorData,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                };
                
                // Reject the promise with the enhanced error
                return Promise.reject(error);
            }

            // For 204 No Content, there's no body to parse
            if (response.status === 204) {
                 // Success logging removed for cleaner console output
                return null;
            }

            const data = await response.json();
            // Success logging removed for cleaner console output
            return data;

        } catch (error) {
            console.error('[API Client] Network or request failed:', error);
            // Re-throw the error to be caught by the calling function
            throw error;
        }
    }
};

// Make it globally available or handle as a module
window.apiClient = apiClient; 