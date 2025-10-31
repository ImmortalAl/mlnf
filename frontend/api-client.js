/**
 * MLNF API Client
 * Handles all communication with the backend API
 */

(function() {
    'use strict';
    
    // API Configuration - Auto-detect environment
    const API_BASE_URL = (function() {
        // Check if we're running on production (Netlify/Vercel)
        const hostname = window.location.hostname;
        
        // If on Netlify or custom domain, use production backend
        if (hostname.includes('netlify.app') || hostname.includes('mlnf.net') || hostname.includes('vercel.app')) {
            return 'https://much-love-no-fear.onrender.com/api';
        }
        
        // If on sandbox or localhost, use localhost backend
        if (hostname.includes('sandbox.novita.ai') || hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        
        // Default to production
        return 'https://much-love-no-fear.onrender.com/api';
    })();
    
    // Helper function to get auth token
    function getAuthToken() {
        return localStorage.getItem('mlnf_token');
    }
    
    // Helper function to handle API responses
    async function handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    }
    
    // API Client
    const APIClient = {
        // Authentication Endpoints
        auth: {
            /**
             * Register new user
             * @param {Object} userData - { username, password, email?, firstName?, lastName? }
             * @returns {Promise<Object>} { user, token }
             */
            async register(userData) {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                return handleResponse(response);
            },
            
            /**
             * Login user
             * @param {Object} credentials - { username, password }
             * @returns {Promise<Object>} { user, token }
             */
            async login(credentials) {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                });
                
                return handleResponse(response);
            },
            
            /**
             * Get current user profile
             * @returns {Promise<Object>} { user }
             */
            async getProfile() {
                const token = getAuthToken();
                if (!token) throw new Error('No authentication token');
                
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                return handleResponse(response);
            }
        },
        
        // Video Endpoints
        videos: {
            /**
             * Get all videos
             * @returns {Promise<Array>} Array of videos
             */
            async getAll() {
                const response = await fetch(`${API_BASE_URL}/videos`, {
                    method: 'GET'
                });
                
                return handleResponse(response);
            },
            
            /**
             * Get single video
             * @param {string} videoId - Video ID
             * @returns {Promise<Object>} Video object
             */
            async getById(videoId) {
                const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
                    method: 'GET'
                });
                
                return handleResponse(response);
            },
            
            /**
             * Vote on video
             * @param {string} videoId - Video ID
             * @param {string} voteType - 'upvote' or 'downvote'
             * @returns {Promise<Object>} Updated vote counts
             */
            async vote(videoId, voteType) {
                const token = getAuthToken();
                if (!token) throw new Error('Must be logged in to vote');
                
                const response = await fetch(`${API_BASE_URL}/videos/${videoId}/vote`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ voteType })
                });
                
                return handleResponse(response);
            },
            
            /**
             * Boost video with Runegold
             * @param {string} videoId - Video ID
             * @param {number} amount - Runegold amount
             * @returns {Promise<Object>} Updated video
             */
            async boost(videoId, amount) {
                const token = getAuthToken();
                if (!token) throw new Error('Must be logged in to boost');
                
                const response = await fetch(`${API_BASE_URL}/videos/${videoId}/boost`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ amount })
                });
                
                return handleResponse(response);
            },
            
            /**
             * Upload video
             * @param {FormData} formData - Video file and metadata
             * @returns {Promise<Object>} Created video
             */
            async upload(formData) {
                const token = getAuthToken();
                if (!token) throw new Error('Must be logged in to upload');
                
                const response = await fetch(`${API_BASE_URL}/videos/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                return handleResponse(response);
            }
        },
        
        // Comment Endpoints
        comments: {
            /**
             * Get comments for video
             * @param {string} videoId - Video ID
             * @returns {Promise<Object>} { comments: Array }
             */
            async getByVideoId(videoId) {
                // Comments are embedded in video, fetch video to get comments
                const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
                    method: 'GET'
                });
                
                const data = await handleResponse(response);
                return { 
                    comments: data.video?.comments || [] 
                };
            },
            
            /**
             * Add comment to video
             * @param {string} videoId - Video ID
             * @param {string} content - Comment content
             * @returns {Promise<Object>} Created comment
             */
            async create(videoId, content) {
                const token = getAuthToken();
                if (!token) throw new Error('Must be logged in to comment');
                
                const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content })
                });
                
                return handleResponse(response);
            }
        },
        
        // Health check
        async checkHealth() {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET'
            });
            
            return handleResponse(response);
        }
    };
    
    // Export to global scope
    window.APIClient = APIClient;
    
})();
