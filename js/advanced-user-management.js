// MLNF Advanced User Management System
// Comprehensive user management with roles, permissions, and social features

class AdvancedUserManager {
    constructor() {
        this.currentUser = null;
        this.userCache = new Map();
        this.relationshipCache = new Map();
        this.permissionCache = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentUser();
    }

    // ===== USER ROLES & PERMISSIONS =====
    
    static USER_ROLES = {
        GUEST: { 
            level: 0, 
            name: 'Guest', 
            permissions: ['read_public'] 
        },
        USER: { 
            level: 10, 
            name: 'Eternal Soul', 
            permissions: ['read_public', 'create_content', 'comment', 'message'] 
        },
        VERIFIED: { 
            level: 20, 
            name: 'Verified Soul', 
            permissions: ['read_public', 'create_content', 'comment', 'message', 'create_chronicles'] 
        },
        CONTRIBUTOR: { 
            level: 30, 
            name: 'Chronicle Contributor', 
            permissions: ['read_public', 'create_content', 'comment', 'message', 'create_chronicles', 'edit_others_content'] 
        },
        MODERATOR: { 
            level: 40, 
            name: 'Eternal Guardian', 
            permissions: ['read_public', 'create_content', 'comment', 'message', 'create_chronicles', 'edit_others_content', 'moderate_content', 'manage_users'] 
        },
        ADMIN: { 
            level: 50, 
            name: 'Immortal Overseer', 
            permissions: ['*'] // All permissions
        }
    };

    static USER_BADGES = {
        FOUNDER: { icon: '👑', name: 'Founder', description: 'Original architect of MLNF' },
        EARLY_ADOPTER: { icon: '🌟', name: 'Early Soul', description: 'Among the first eternal beings' },
        CONTENT_CREATOR: { icon: '✍️', name: 'Scroll Master', description: 'Prolific content creator' },
        COMMUNITY_BUILDER: { icon: '🤝', name: 'Soul Connector', description: 'Brings souls together' },
        HELPFUL_SOUL: { icon: '💫', name: 'Helpful Soul', description: 'Always lending a hand' },
        BUG_HUNTER: { icon: '🐛', name: 'Bug Hunter', description: 'Helps improve the platform' },
        BETA_TESTER: { icon: '🧪', name: 'Beta Tester', description: 'Tests new features' },
        VERIFIED: { icon: '✅', name: 'Verified', description: 'Identity verified' }
    };

    // ===== USER PROFILE MANAGEMENT =====

    async createAdvancedProfile(userData) {
        const profileData = {
            // Basic Info
            username: userData.username,
            email: userData.email,
            displayName: userData.displayName,
            
            // Extended Profile
            profile: {
                bio: userData.bio || '',
                location: userData.location || '',
                website: userData.website || '',
                interests: userData.interests || [],
                skills: userData.skills || [],
                languages: userData.languages || ['en'],
                timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                
                // Social Links
                socialLinks: {
                    twitter: userData.twitter || '',
                    github: userData.github || '',
                    linkedin: userData.linkedin || '',
                    discord: userData.discord || ''
                },
                
                // Privacy Settings
                privacy: {
                    showEmail: false,
                    showOnlineStatus: true,
                    allowDirectMessages: true,
                    showActivity: true,
                    searchable: true
                },
                
                // Preferences
                preferences: {
                    theme: 'dark',
                    language: 'en',
                    notifications: {
                        email: true,
                        push: true,
                        mentions: true,
                        messages: true,
                        follows: true,
                        likes: false
                    },
                    accessibility: {
                        highContrast: false,
                        reducedMotion: false,
                        fontSize: 'medium'
                    }
                }
            },
            
            // User Status & Metadata
            role: 'USER',
            badges: [],
            reputation: 0,
            joinedAt: new Date(),
            lastActiveAt: new Date(),
            
            // Social Features
            followers: [],
            following: [],
            blockedUsers: [],
            
            // Content Stats
            stats: {
                postsCreated: 0,
                commentsPosted: 0,
                likesReceived: 0,
                messagesExchanged: 0,
                chroniclesSubmitted: 0
            }
        };

        try {
            const response = await window.apiClient.post('/users/advanced-profile', profileData);
            this.currentUser = response.user;
            this.cacheUser(response.user);
            return response.user;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to create advanced profile:', error);
            throw error;
        }
    }

    // ===== USER RELATIONSHIPS =====

    async followUser(targetUserId) {
        try {
            const response = await window.apiClient.post(`/users/${targetUserId}/follow`);
            this.updateRelationshipCache(targetUserId, 'following', true);
            await this.showNotification(`You are now following ${response.username}`, 'success');
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to follow user:', error);
            await this.showNotification('Failed to follow user', 'error');
            throw error;
        }
    }

    async unfollowUser(targetUserId) {
        try {
            const response = await window.apiClient.delete(`/users/${targetUserId}/follow`);
            this.updateRelationshipCache(targetUserId, 'following', false);
            await this.showNotification(`You unfollowed ${response.username}`, 'info');
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to unfollow user:', error);
            throw error;
        }
    }

    async blockUser(targetUserId, reason = '') {
        try {
            const response = await window.apiClient.post(`/users/${targetUserId}/block`, { reason });
            this.updateRelationshipCache(targetUserId, 'blocked', true);
            await this.showNotification('User blocked successfully', 'success');
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to block user:', error);
            throw error;
        }
    }

    async unblockUser(targetUserId) {
        try {
            const response = await window.apiClient.delete(`/users/${targetUserId}/block`);
            this.updateRelationshipCache(targetUserId, 'blocked', false);
            await this.showNotification('User unblocked', 'info');
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to unblock user:', error);
            throw error;
        }
    }

    async reportUser(targetUserId, reportData) {
        try {
            const response = await window.apiClient.post(`/users/${targetUserId}/report`, {
                reason: reportData.reason,
                description: reportData.description,
                evidence: reportData.evidence || []
            });
            await this.showNotification('Report submitted successfully', 'success');
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to report user:', error);
            throw error;
        }
    }

    // ===== PERMISSION SYSTEM =====

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userRole = AdvancedUserManager.USER_ROLES[this.currentUser.role];
        if (!userRole) return false;
        
        // Admin has all permissions
        if (userRole.permissions.includes('*')) return true;
        
        return userRole.permissions.includes(permission);
    }

    canAccessContent(content) {
        if (content.visibility === 'public') return true;
        if (content.visibility === 'followers_only') {
            return this.isFollowing(content.authorId) || content.authorId === this.currentUser?.id;
        }
        if (content.visibility === 'private') {
            return content.authorId === this.currentUser?.id;
        }
        return false;
    }

    canModerateUser(targetUser) {
        if (!this.currentUser) return false;
        
        const currentRole = AdvancedUserManager.USER_ROLES[this.currentUser.role];
        const targetRole = AdvancedUserManager.USER_ROLES[targetUser.role];
        
        return currentRole.level > targetRole.level && this.hasPermission('manage_users');
    }

    // ===== USER SEARCH & DISCOVERY =====

    async searchUsers(query, filters = {}) {
        try {
            const searchParams = new URLSearchParams({
                q: query,
                ...filters,
                limit: filters.limit || 20,
                page: filters.page || 1
            });

            const response = await window.apiClient.get(`/users/search?${searchParams}`);
            
            // Cache search results
            response.users.forEach(user => this.cacheUser(user));
            
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] User search failed:', error);
            throw error;
        }
    }

    async getSuggestedUsers() {
        try {
            const response = await window.apiClient.get('/users/suggested');
            response.users.forEach(user => this.cacheUser(user));
            return response.users;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to get suggested users:', error);
            return [];
        }
    }

    async getNearbyUsers(location) {
        try {
            const response = await window.apiClient.post('/users/nearby', { location });
            response.users.forEach(user => this.cacheUser(user));
            return response.users;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to get nearby users:', error);
            return [];
        }
    }

    // ===== USER ANALYTICS =====

    async getUserAnalytics(userId = null) {
        const targetId = userId || this.currentUser?.id;
        if (!targetId) return null;

        try {
            const response = await window.apiClient.get(`/users/${targetId}/analytics`);
            return {
                profile: response.profile,
                activity: response.activity,
                engagement: response.engagement,
                growth: response.growth,
                achievements: response.achievements
            };
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to get user analytics:', error);
            return null;
        }
    }

    // ===== REPUTATION SYSTEM =====

    async updateReputation(targetUserId, action, reason = '') {
        if (!this.hasPermission('manage_users')) return;

        try {
            const response = await window.apiClient.post(`/users/${targetUserId}/reputation`, {
                action, // 'increase' or 'decrease'
                amount: this.getReputationAmount(action),
                reason,
                moderatorId: this.currentUser.id
            });

            await this.showNotification(`Reputation ${action}d for user`, 'success');
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to update reputation:', error);
            throw error;
        }
    }

    getReputationAmount(action) {
        const amounts = {
            'helpful_content': 10,
            'quality_post': 5,
            'spam_report': -5,
            'rule_violation': -10,
            'harassment': -25
        };
        return amounts[action] || 1;
    }

    // ===== BADGE SYSTEM =====

    async awardBadge(targetUserId, badgeId, reason = '') {
        if (!this.hasPermission('manage_users')) return;

        try {
            const response = await window.apiClient.post(`/users/${targetUserId}/badges`, {
                badgeId,
                reason,
                awardedBy: this.currentUser.id,
                awardedAt: new Date()
            });

            const badge = AdvancedUserManager.USER_BADGES[badgeId];
            await this.showNotification(`Awarded "${badge.name}" badge`, 'success');
            return response;
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to award badge:', error);
            throw error;
        }
    }

    // ===== CACHING & UTILITY METHODS =====

    cacheUser(user) {
        this.userCache.set(user.id, {
            ...user,
            cachedAt: Date.now()
        });
    }

    getCachedUser(userId) {
        const cached = this.userCache.get(userId);
        if (!cached) return null;
        
        // Cache valid for 5 minutes
        if (Date.now() - cached.cachedAt > 300000) {
            this.userCache.delete(userId);
            return null;
        }
        
        return cached;
    }

    updateRelationshipCache(targetUserId, relationship, status) {
        const key = `${this.currentUser?.id}-${targetUserId}-${relationship}`;
        this.relationshipCache.set(key, status);
    }

    isFollowing(targetUserId) {
        const key = `${this.currentUser?.id}-${targetUserId}-following`;
        return this.relationshipCache.get(key) || false;
    }

    isBlocked(targetUserId) {
        const key = `${this.currentUser?.id}-${targetUserId}-blocked`;
        return this.relationshipCache.get(key) || false;
    }

    async showNotification(message, type = 'info') {
        // Integration with notification system
        if (window.MLNF && window.MLNF.showNotification) {
            window.MLNF.showNotification(message, type);
        } else {
        }
    }

    setupEventListeners() {
        document.addEventListener('click', this.handleUserActions.bind(this));
    }

    handleUserActions(event) {
        const action = event.target.dataset.userAction;
        const targetUserId = event.target.dataset.userId;

        if (!action || !targetUserId) return;

        switch (action) {
            case 'follow':
                this.followUser(targetUserId);
                break;
            case 'unfollow':
                this.unfollowUser(targetUserId);
                break;
            case 'block':
                this.showBlockModal(targetUserId);
                break;
            case 'report':
                this.showReportModal(targetUserId);
                break;
            case 'message':
                this.openMessageModal(targetUserId);
                break;
        }
    }

    async loadCurrentUser() {
        if (!window.authManager?.isLoggedIn()) return;

        try {
            this.currentUser = await window.apiClient.get('/users/me/extended');
            this.cacheUser(this.currentUser);
        } catch (error) {
            console.error('[AdvancedUserManager] Failed to load current user:', error);
        }
    }
}

// Initialize global advanced user manager
window.MLNF = window.MLNF || {};
window.MLNF.advancedUserManager = new AdvancedUserManager();