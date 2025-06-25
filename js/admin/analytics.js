// Analytics JavaScript
// Handles analytics charts and metrics display

const AdminAnalytics = {
    apiBaseUrl: null,

    init() {
        this.apiBaseUrl = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
        this.loadAnalytics();
        this.initCharts();
    },

    async loadAnalytics() {
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No authentication token');

            // Load basic metrics
            const usersResponse = await fetch(`${this.apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (usersResponse.ok) {
                const users = await usersResponse.json();
                this.updateMetrics(users);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data');
        }
    },

    updateMetrics(users) {
        // Calculate metrics
        const onlineUsers = users.filter(u => u.online).length;
        const dailyActive = this.calculateDailyActive(users);
        const avgSession = '24m'; // Placeholder
        const contentRate = '12/day'; // Placeholder
        const engagement = '87%'; // Placeholder

        // Update metric displays
        this.updateMetricElement('avgSession', avgSession);
        this.updateMetricElement('dailyActive', dailyActive);
        this.updateMetricElement('contentRate', contentRate);
        this.updateMetricElement('engagement', engagement);
    },

    updateMetricElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    calculateDailyActive(users) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return users.filter(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
            return lastLogin && lastLogin >= today;
        }).length;
    },

    initCharts() {
        // Initialize placeholder charts
        this.createUserGrowthChart();
        this.createActivityChart();
    },

    createUserGrowthChart() {
        const canvas = document.getElementById('userGrowthChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple placeholder chart - you would use Chart.js or similar library here
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(10, 50, 20, 100);
        ctx.fillRect(40, 30, 20, 120);
        ctx.fillRect(70, 10, 20, 140);
        ctx.fillRect(100, 5, 20, 145);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('User Growth Chart', 10, 20);
        ctx.fillText('(Placeholder)', 10, 35);
    },

    createActivityChart() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple placeholder chart
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(10, 80, 30, 70);
        ctx.fillRect(50, 60, 30, 90);
        ctx.fillRect(90, 40, 30, 110);
        ctx.fillRect(130, 20, 30, 130);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('Activity Patterns', 10, 20);
        ctx.fillText('(Placeholder)', 10, 35);
    },

    showError(message) {
        console.error('Analytics Error:', message);
        // Could show a toast notification or error banner
    }
};

// Make it globally available
window.AdminAnalytics = AdminAnalytics;
