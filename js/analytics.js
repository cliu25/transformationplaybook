/**
 * AIFT Playbook Analytics Tracking
 * Custom event tracking for Google Analytics 4
 * 
 * This file provides functions to track user interactions with the playbook.
 * All tracking respects user privacy and can be disabled by not configuring GA4.
 */

// Check if gtag is available (GA4 is configured)
const isAnalyticsEnabled = () => {
    return typeof gtag !== 'undefined';
};

/**
 * Track phase navigation
 * @param {string} phaseName - Name of the phase being viewed
 * @param {string} phaseId - ID of the phase
 */
const trackPhaseView = (phaseName, phaseId) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'phase_view', {
        'event_category': 'Navigation',
        'event_label': phaseName,
        'phase_id': phaseId,
        'phase_name': phaseName
    });
    
    console.log('[Analytics] Phase view tracked:', phaseName);
};

/**
 * Track module/chapter interactions
 * @param {string} moduleName - Name of the module clicked
 * @param {string} moduleId - ID of the module
 * @param {string} phaseName - Parent phase name
 */
const trackModuleClick = (moduleName, moduleId, phaseName) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'module_click', {
        'event_category': 'Content',
        'event_label': moduleName,
        'module_id': moduleId,
        'module_name': moduleName,
        'phase_name': phaseName
    });
    
    console.log('[Analytics] Module click tracked:', moduleName);
};

/**
 * Track chatbot interactions
 * @param {string} action - Type of chatbot action (open, close, send_message, clear)
 * @param {object} metadata - Additional metadata about the interaction
 */
const trackChatbotInteraction = (action, metadata = {}) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'chatbot_interaction', {
        'event_category': 'Chatbot',
        'event_label': action,
        'action': action,
        ...metadata
    });
    
    console.log('[Analytics] Chatbot interaction tracked:', action);
};

/**
 * Track search queries
 * @param {string} query - Search query text
 * @param {number} resultsCount - Number of results returned
 */
const trackSearch = (query, resultsCount) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'search', {
        'event_category': 'Search',
        'search_term': query,
        'results_count': resultsCount
    });
    
    console.log('[Analytics] Search tracked:', query, 'Results:', resultsCount);
};

/**
 * Track external link clicks
 * @param {string} url - URL being clicked
 * @param {string} linkText - Text of the link
 */
const trackExternalLink = (url, linkText) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'click', {
        'event_category': 'External Link',
        'event_label': linkText,
        'link_url': url,
        'link_text': linkText
    });
    
    console.log('[Analytics] External link tracked:', url);
};

/**
 * Track time spent on a phase
 * @param {string} phaseName - Name of the phase
 * @param {number} timeSeconds - Time spent in seconds
 */
const trackTimeOnPhase = (phaseName, timeSeconds) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'timing_complete', {
        'event_category': 'Engagement',
        'name': 'time_on_phase',
        'value': timeSeconds,
        'phase_name': phaseName
    });
    
    console.log('[Analytics] Time on phase tracked:', phaseName, timeSeconds, 'seconds');
};

/**
 * Track scroll depth
 * @param {number} percentage - Scroll depth percentage (25, 50, 75, 100)
 */
const trackScrollDepth = (percentage) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'scroll', {
        'event_category': 'Engagement',
        'event_label': `${percentage}%`,
        'percent_scrolled': percentage
    });
    
    console.log('[Analytics] Scroll depth tracked:', percentage + '%');
};

/**
 * Track artifact downloads
 * @param {string} artifactName - Name of the artifact
 * @param {string} artifactType - Type of artifact (template, guide, etc.)
 */
const trackArtifactDownload = (artifactName, artifactType) => {
    if (!isAnalyticsEnabled()) return;
    
    gtag('event', 'file_download', {
        'event_category': 'Artifact',
        'event_label': artifactName,
        'artifact_name': artifactName,
        'artifact_type': artifactType
    });
    
    console.log('[Analytics] Artifact download tracked:', artifactName);
};

// Initialize analytics tracking when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Analytics] Initializing custom event tracking...');
    
    if (!isAnalyticsEnabled()) {
        console.log('[Analytics] Google Analytics not configured. Tracking disabled.');
        return;
    }
    
    console.log('[Analytics] Google Analytics 4 is active.');
    
    // Track scroll depth
    let scrollDepthTracked = {
        25: false,
        50: false,
        75: false,
        100: false
    };
    
    window.addEventListener('scroll', () => {
        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        
        Object.keys(scrollDepthTracked).forEach(depth => {
            if (scrollPercentage >= depth && !scrollDepthTracked[depth]) {
                trackScrollDepth(parseInt(depth));
                scrollDepthTracked[depth] = true;
            }
        });
    });
    
    // Track external links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && (link.hostname !== window.location.hostname || link.target === '_blank')) {
            trackExternalLink(link.href, link.textContent || link.href);
        }
    });
    
    // Track time on page/phase
    let phaseStartTime = Date.now();
    let currentPhase = null;
    
    // Create a MutationObserver to detect phase changes
    const observer = new MutationObserver(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            const phaseTitle = mainContent.querySelector('h1, h2');
            if (phaseTitle && phaseTitle.textContent !== currentPhase) {
                // Track time on previous phase
                if (currentPhase) {
                    const timeSpent = Math.round((Date.now() - phaseStartTime) / 1000);
                    trackTimeOnPhase(currentPhase, timeSpent);
                }
                
                // Update current phase
                currentPhase = phaseTitle.textContent;
                phaseStartTime = Date.now();
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Track time on page before unload
    window.addEventListener('beforeunload', () => {
        if (currentPhase) {
            const timeSpent = Math.round((Date.now() - phaseStartTime) / 1000);
            trackTimeOnPhase(currentPhase, timeSpent);
        }
    });
    
    console.log('[Analytics] Custom event tracking initialized successfully.');
});

// Export functions for use in other scripts
window.AIFTAnalytics = {
    trackPhaseView,
    trackModuleClick,
    trackChatbotInteraction,
    trackSearch,
    trackExternalLink,
    trackTimeOnPhase,
    trackScrollDepth,
    trackArtifactDownload,
    isEnabled: isAnalyticsEnabled
};

// Made with Bob
