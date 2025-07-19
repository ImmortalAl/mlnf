// MLNF Analytics Tracker
// Comprehensive visitor and engagement tracking system

const MLNFAnalytics = {
    apiBaseUrl: null,
    visitorId: null,
    sessionId: null,
    isAdmin: false,
    
    init() {
        this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
        this.checkAdminStatus();
        this.generateVisitorId();
        this.generateSessionId();
        this.trackPageView();
        this.setupEventListeners();
    },

    // Check if current user is admin (exclude from analytics)
    checkAdminStatus() {
        try {
            const token = localStorage.getItem('sessionToken');
            if (token) {
                // Decode JWT to check role (basic check)
                const payload = JSON.parse(atob(token.split('.')[1]));
                this.isAdmin = payload.role === 'admin' || payload.isAdmin === true;
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            this.isAdmin = false;
        }
    },

    // Generate unique visitor ID using browser fingerprinting
    generateVisitorId() {
        let visitorId = localStorage.getItem('mlnf_visitor_id');
        
        if (!visitorId) {
            // Create fingerprint from available browser data
            const fingerprint = this.createBrowserFingerprint();
            visitorId = 'v_' + fingerprint + '_' + Date.now();
            localStorage.setItem('mlnf_visitor_id', visitorId);
        }
        
        this.visitorId = visitorId;
    },

    // Create browser fingerprint for visitor identification
    createBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('MLNF fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    },

    // Generate session ID for visit tracking
    generateSessionId() {
        let sessionId = sessionStorage.getItem('mlnf_session_id');
        const lastActivity = localStorage.getItem('mlnf_last_activity');
        const now = Date.now();
        
        // New session if no existing session or 30+ minutes of inactivity
        if (!sessionId || !lastActivity || (now - parseInt(lastActivity)) > (30 * 60 * 1000)) {
            sessionId = 's_' + now + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('mlnf_session_id', sessionId);
            this.trackNewVisit();
        }
        
        this.sessionId = sessionId;
        localStorage.setItem('mlnf_last_activity', now.toString());
    },

    // Track new visit/session
    async trackNewVisit() {
        if (this.isAdmin) return;
        
        try {
            await this.sendAnalytics('visit', {
                type: 'new_visit',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error tracking visit:', error);
        }
    },

    // Track page view
    async trackPageView() {
        if (this.isAdmin) return;
        
        try {
            const pageData = {
                type: 'page_view',
                url: window.location.pathname,
                title: document.title,
                referrer: document.referrer || 'direct',
                timestamp: new Date().toISOString()
            };
            
            await this.sendAnalytics('page', pageData);
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    },

    // Track resource hits (CSS, JS, etc.)
    async trackHit(resourceUrl, resourceType) {
        if (this.isAdmin) return;
        
        try {
            const hitData = {
                type: 'hit',
                resource_url: resourceUrl,
                resource_type: resourceType,
                page_url: window.location.pathname,
                timestamp: new Date().toISOString()
            };
            
            await this.sendAnalytics('hit', hitData);
        } catch (error) {
            console.error('Error tracking hit:', error);
        }
    },

    // Track user engagement actions
    async trackEngagement(action, data = {}) {
        if (this.isAdmin) return;
        
        try {
            const engagementData = {
                type: 'engagement',
                action: action, // 'blog_post', 'comment', 'vote', 'thread_create', etc.
                ...data,
                timestamp: new Date().toISOString()
            };
            
            await this.sendAnalytics('engagement', engagementData);
        } catch (error) {
            console.error('Error tracking engagement:', error);
        }
    },

    // Get visitor details for analytics
    getVisitorDetails() {
        return {
            visitor_id: this.visitorId,
            session_id: this.sessionId,
            user_agent: navigator.userAgent,
            language: navigator.language,
            screen_resolution: `${screen.width}x${screen.height}`,
            color_depth: screen.colorDepth,
            timezone_offset: new Date().getTimezoneOffset(),
            device_type: this.getDeviceType(),
            browser: this.getBrowser(),
            platform: navigator.platform
        };
    },

    // Detect device type
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/tablet|ipad|playbook|silk/.test(userAgent)) {
            return 'Tablet';
        }
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
            return 'Mobile';
        }
        return 'Desktop';
    },

    // Detect browser
    getBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        return 'Other';
    },

    // Extract search query from referrer
    extractSearchQuery(referrer) {
        if (!referrer || referrer === 'direct') return null;
        
        try {
            const url = new URL(referrer);
            const hostname = url.hostname.toLowerCase();
            
            // Google
            if (hostname.includes('google.')) {
                return url.searchParams.get('q');
            }
            // Bing
            if (hostname.includes('bing.')) {
                return url.searchParams.get('q');
            }
            // DuckDuckGo
            if (hostname.includes('duckduckgo.')) {
                return url.searchParams.get('q');
            }
            // Yahoo
            if (hostname.includes('yahoo.')) {
                return url.searchParams.get('p');
            }
        } catch (error) {
            console.error('Error extracting search query:', error);
        }
        
        return null;
    },

    // Get referrer category
    getReferrerCategory(referrer) {
        if (!referrer || referrer === 'direct') return 'Direct';
        
        try {
            const url = new URL(referrer);
            const hostname = url.hostname.toLowerCase();
            
            if (hostname.includes('google.')) return 'Google Search';
            if (hostname.includes('bing.')) return 'Bing Search';
            if (hostname.includes('duckduckgo.')) return 'DuckDuckGo';
            if (hostname.includes('yahoo.')) return 'Yahoo Search';
            if (hostname.includes('facebook.')) return 'Facebook';
            if (hostname.includes('twitter.') || hostname.includes('t.co')) return 'Twitter';
            if (hostname.includes('reddit.')) return 'Reddit';
            if (hostname.includes('youtube.')) return 'YouTube';
            
            // Check if it's the same domain
            if (hostname === window.location.hostname) return 'Internal';
            
            return 'Other Websites';
        } catch (error) {
            return 'Other';
        }
    },

    // Send analytics data to backend
    async sendAnalytics(endpoint, data) {
        if (this.isAdmin) return;
        
        try {
            const payload = {
                ...data,
                visitor_details: this.getVisitorDetails(),
                search_query: this.extractSearchQuery(data.referrer),
                referrer_category: this.getReferrerCategory(data.referrer)
            };
            
            // Send async to avoid blocking page load
            fetch(`${this.apiBaseUrl}/analytics/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).catch(error => {
                console.error('Analytics tracking error:', error);
            });
        } catch (error) {
            console.error('Error preparing analytics data:', error);
        }
    },

    // Setup event listeners for automatic tracking
    setupEventListeners() {
        // Track clicks on external links
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href && !link.href.startsWith(window.location.origin)) {
                this.trackEngagement('external_link_click', {
                    link_url: link.href,
                    link_text: link.textContent.trim()
                });
            }
        });

        // Track form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                this.trackEngagement('form_submit', {
                    form_id: form.id || 'unknown',
                    form_action: form.action || window.location.pathname
                });
            }
        });

        // Track resource loads
        window.addEventListener('load', () => {
            // Track CSS and JS loads
            document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                this.trackHit(link.href, 'css');
            });
            
            document.querySelectorAll('script[src]').forEach(script => {
                this.trackHit(script.src, 'javascript');
            });
        });

        // Update last activity timestamp
        ['click', 'scroll', 'keydown'].forEach(event => {
            document.addEventListener(event, () => {
                localStorage.setItem('mlnf_last_activity', Date.now().toString());
            }, { passive: true });
        });
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MLNFAnalytics.init());
} else {
    MLNFAnalytics.init();
}

// Make globally available for manual tracking
window.MLNFAnalytics = MLNFAnalytics;