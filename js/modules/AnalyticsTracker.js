/**
 * AnalyticsTracker Module
 * 
 * Automatic client-side analytics data collection and submission to WordPress backend
 * Integrates with JetEngine Custom Content Type: analytics_event
 */

class AnalyticsTracker {
    constructor() {
        this.pageLoadTime = Date.now();
        this.sessionId = this.getSessionId();
        this.userId = this.getUserId();
        this.apiBaseUrl = this.getApiBaseUrl();
        
        // Auto-initialize tracking
        this.setupEventListeners();
        
        console.log('AnalyticsTracker initialized:', {
            sessionId: this.sessionId,
            userId: this.userId,
            apiBaseUrl: this.apiBaseUrl
        });
    }

    /**
     * Environment-aware API base URL detection
     */
    getApiBaseUrl() {
        const hostname = window.location.hostname;
        console.log(hostname);
        
        if (hostname === 'christinmorton.local' || hostname.includes('localhost')) {
            // Development environment - use HTTP to avoid SSL certificate issues
            return 'http://christinmorton.local/wp-json';
        } else {
            // Production environment  
            return 'https://cms.christinmorton.com/wp-json';
        }
    }

    /**
     * Generate or retrieve session ID from sessionStorage
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Generate or retrieve user ID from localStorage
     */
    getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }

    /**
     * Generate chain ID for related events
     */
    generateChainId(context = 'session') {
        return `chain_${context}_${this.sessionId}`;
    }

    /**
     * Collect all client-side analytics data
     */
    collectAnalyticsData(eventType, additionalData = {}) {
        return {
            event_type: eventType,
            ts_loaded: new Date(this.pageLoadTime).toISOString(),
            ts_submitted: new Date().toISOString(),
            user_agent_signature: navigator.userAgent,
            page_path: window.location.pathname + window.location.search,
            referrer: document.referrer || 'direct',
            session_id: this.sessionId,
            user_id: this.userId,
            chain_id: this.generateChainId('session'),
            ...additionalData
        };
    }

    /**
     * Send analytics event to WordPress backend
     */
    async sendAnalyticsEvent(eventType, additionalData = {}) {
        try {
            const analyticsData = this.collectAnalyticsData(eventType, additionalData);
            
            const response = await fetch(`${this.apiBaseUrl}/jet-cct/analytics_event`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(analyticsData)
            });

            if (!response.ok) {
                throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            console.log(`Analytics event sent: ${eventType}`, {
                eventId: result.id,
                timestamp: analyticsData.ts_submitted
            });
            
            return result;
            
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
            // Fail silently to not impact user experience
            return null;
        }
    }

    /**
     * Track page load event
     */
    trackPageLoad() {
        this.sendAnalyticsEvent('page_load', {
            chain_id: this.generateChainId('pageview')
        });
    }

    /**
     * Track form submission event
     */
    trackFormSubmit(formData = {}) {
        const messageId = formData.messageId || null;
        const formType = formData.type || 'unknown';
        
        this.sendAnalyticsEvent('form_submit', {
            message_id: messageId,
            chain_id: this.generateChainId(`form_${formType}`)
        });
    }

    /**
     * Track form interaction start
     */
    trackFormStart(formType = 'contact') {
        this.sendAnalyticsEvent('form_start', {
            chain_id: this.generateChainId(`form_${formType}`)
        });
    }

    /**
     * Track click events
     */
    trackClick(elementInfo = {}) {
        this.sendAnalyticsEvent('click', {
            chain_id: this.generateChainId('interaction'),
            ...elementInfo
        });
    }

    /**
     * Track page exit
     */
    trackExit() {
        // Use sendBeacon for reliable exit tracking
        const analyticsData = this.collectAnalyticsData('exit', {
            chain_id: this.generateChainId('session')
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                `${this.apiBaseUrl}/jet-cct/analytics_event`,
                JSON.stringify(analyticsData)
            );
        } else {
            // Fallback for older browsers
            this.sendAnalyticsEvent('exit');
        }
    }

    /**
     * Setup automatic event listeners
     */
    setupEventListeners() {
        // Track page load (after DOM is ready)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.trackPageLoad(), 100);
            });
        } else {
            // DOM already loaded
            setTimeout(() => this.trackPageLoad(), 100);
        }

        // Track page exit
        window.addEventListener('beforeunload', () => {
            this.trackExit();
        });

        // Track form interactions (will be attached to specific forms)
        this.setupFormTracking();

        // Track important click events
        this.setupClickTracking();
    }

    /**
     * Setup form interaction tracking
     */
    setupFormTracking() {
        // Track when user first interacts with any form
        document.addEventListener('focusin', (event) => {
            const form = event.target.closest('form');
            if (form && !form.dataset.analyticsTracked) {
                form.dataset.analyticsTracked = 'true';
                
                const formType = this.getFormType(form);
                this.trackFormStart(formType);
            }
        });
    }

    /**
     * Setup click tracking for important elements
     */
    setupClickTracking() {
        // Track CTA button clicks
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button, a');
            if (button) {
                const elementInfo = {
                    element_type: button.tagName.toLowerCase(),
                    element_class: button.className,
                    element_text: button.textContent?.trim().substring(0, 100) || '',
                    element_href: button.href || ''
                };

                // Only track important interactive elements
                if (this.shouldTrackClick(button)) {
                    this.trackClick(elementInfo);
                }
            }
        });
    }

    /**
     * Determine if click should be tracked
     */
    shouldTrackClick(element) {
        // Track form submit buttons
        if (element.type === 'submit') return true;
        
        // Track CTA buttons
        if (element.classList.contains('action-button')) return true;
        
        // Track navigation links
        if (element.classList.contains('nav-link')) return true;
        
        // Track social links
        if (element.closest('.social-links')) return true;
        
        return false;
    }

    /**
     * Determine form type from form element
     */
    getFormType(form) {
        // Check form ID
        if (form.id === 'contactForm') return 'contact';
        if (form.id === 'newsletterForm') return 'newsletter';
        
        // Check form classes
        if (form.classList.contains('contact-form')) return 'contact';
        if (form.classList.contains('newsletter-form')) return 'newsletter';
        if (form.classList.contains('consultation-form')) return 'consultation';
        
        // Default
        return 'unknown';
    }

    /**
     * Get analytics data for debugging
     */
    getDebugInfo() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            pageLoadTime: new Date(this.pageLoadTime).toISOString(),
            currentPath: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent
        };
    }
}

// Initialize analytics tracker when module is loaded
const analytics = new AnalyticsTracker();

// Export for use in other modules
export default analytics;