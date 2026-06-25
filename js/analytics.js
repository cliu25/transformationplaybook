// Simple Client-Side Analytics Tracker
// Tracks page views, time on page, and user interactions

class SimpleAnalytics {
    constructor() {
        this.storageKey = 'aift_analytics_data';
        this.sessionKey = 'aift_session_id';
        this.currentPageStart = Date.now();
        this.currentPage = null;
        this.sessionId = this.getOrCreateSession();
        this.apiEndpoint = 'http://localhost:5000/api'; // Change this to your server URL
        this.useBackend = true; // Set to false to use local storage only
        this.init();
    }

    init() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.recordTimeOnPage();
            } else {
                this.currentPageStart = Date.now();
            }
        });

        // Track before page unload
        window.addEventListener('beforeunload', () => {
            this.recordTimeOnPage();
        });
    }

    getOrCreateSession() {
        let sessionId = sessionStorage.getItem(this.sessionKey);
        if (!sessionId) {
            sessionId = this.generateId();
            sessionStorage.setItem(this.sessionKey, sessionId);
        }
        return sessionId;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {
            sessions: [],
            pageViews: [],
            events: []
        };
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    async sendToBackend(endpoint, data) {
        if (!this.useBackend) return;
        
        try {
            await fetch(`${this.apiEndpoint}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.warn('Analytics backend unavailable:', error.message);
        }
    }

    trackPageView(page, title = '') {
        // Record time on previous page
        if (this.currentPage) {
            this.recordTimeOnPage();
        }

        const data = this.getData();
        
        const pageView = {
            id: this.generateId(),
            sessionId: this.sessionId,
            page: page,
            title: title,
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        };

        data.pageViews.push(pageView);
        
        // Keep only last 1000 page views
        if (data.pageViews.length > 1000) {
            data.pageViews = data.pageViews.slice(-1000);
        }

        this.saveData(data);
        
        // Send to backend
        this.sendToBackend('/track/pageview', pageView);
        
        // Update current page tracking
        this.currentPage = page;
        this.currentPageStart = Date.now();

        // Track session
        this.trackSession();
    }

    recordTimeOnPage() {
        if (!this.currentPage) return;

        const timeSpent = Math.round((Date.now() - this.currentPageStart) / 1000); // seconds
        
        if (timeSpent < 1) return; // Ignore very short visits

        const data = this.getData();
        
        // Find the most recent page view for this page
        const recentPageView = [...data.pageViews]
            .reverse()
            .find(pv => pv.page === this.currentPage && pv.sessionId === this.sessionId);

        if (recentPageView) {
            recentPageView.timeSpent = (recentPageView.timeSpent || 0) + timeSpent;
            this.saveData(data);
            
            // Send updated time to backend
            this.sendToBackend('/track/pageview', recentPageView);
        }
    }

    trackSession() {
        const data = this.getData();
        
        // Check if session already exists
        const existingSession = data.sessions.find(s => s.id === this.sessionId);
        
        const sessionData = {
            id: this.sessionId,
            startTime: existingSession ? existingSession.startTime : new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        if (!existingSession) {
            data.sessions.push(sessionData);
        } else {
            existingSession.lastActivity = new Date().toISOString();
        }

        // Keep only last 500 sessions
        if (data.sessions.length > 500) {
            data.sessions = data.sessions.slice(-500);
        }

        this.saveData(data);
        
        // Send to backend
        this.sendToBackend('/track/session', sessionData);
    }

    trackEvent(category, action, label = '', value = null) {
        const data = this.getData();
        
        const event = {
            id: this.generateId(),
            sessionId: this.sessionId,
            category: category,
            action: action,
            label: label,
            value: value,
            page: this.currentPage,
            timestamp: new Date().toISOString()
        };

        data.events.push(event);
        
        // Keep only last 1000 events
        if (data.events.length > 1000) {
            data.events = data.events.slice(-1000);
        }

        this.saveData(data);
        
        // Send to backend
        this.sendToBackend('/track/event', event);
    }

    getStats() {
        const data = this.getData();
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Filter data for time periods
        const pageViews7d = data.pageViews.filter(pv => new Date(pv.timestamp) > last7Days);
        const pageViews30d = data.pageViews.filter(pv => new Date(pv.timestamp) > last30Days);
        const sessions7d = data.sessions.filter(s => new Date(s.startTime) > last7Days);
        const sessions30d = data.sessions.filter(s => new Date(s.startTime) > last30Days);

        // Calculate page stats
        const pageStats = {};
        data.pageViews.forEach(pv => {
            if (!pageStats[pv.page]) {
                pageStats[pv.page] = {
                    views: 0,
                    totalTime: 0,
                    avgTime: 0
                };
            }
            pageStats[pv.page].views++;
            pageStats[pv.page].totalTime += (pv.timeSpent || 0);
        });

        // Calculate average time
        Object.keys(pageStats).forEach(page => {
            pageStats[page].avgTime = Math.round(pageStats[page].totalTime / pageStats[page].views);
        });

        // Get unique visitors (sessions)
        const uniqueVisitors7d = new Set(pageViews7d.map(pv => pv.sessionId)).size;
        const uniqueVisitors30d = new Set(pageViews30d.map(pv => pv.sessionId)).size;

        return {
            total: {
                pageViews: data.pageViews.length,
                sessions: data.sessions.length,
                events: data.events.length
            },
            last7Days: {
                pageViews: pageViews7d.length,
                sessions: sessions7d.length,
                uniqueVisitors: uniqueVisitors7d
            },
            last30Days: {
                pageViews: pageViews30d.length,
                sessions: sessions30d.length,
                uniqueVisitors: uniqueVisitors30d
            },
            pageStats: pageStats,
            recentPageViews: data.pageViews.slice(-20).reverse(),
            topPages: Object.entries(pageStats)
                .sort((a, b) => b[1].views - a[1].views)
                .slice(0, 10)
        };
    }

    clearData() {
        if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.sessionKey);
            this.sessionId = this.getOrCreateSession();
            return true;
        }
        return false;
    }

    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.analytics = new SimpleAnalytics();

// Made with Bob
