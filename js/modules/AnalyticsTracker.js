/**
 * AnalyticsTracker Module
 * 
 * Automatic client-side analytics data collection and submission to WordPress backend
 * Integrates with JetEngine Custom Content Type: analytics_event
 * Uses WordPress Application Password authentication
 */

import AppPasswordManager from './AppPasswordManager.js';

class AnalyticsTracker {
    constructor() {
        this.pageLoadTime = Date.now();
        this.sessionId = this.getSessionId();
        this.userId = this.getUserId();
        
        // Initialize authentication manager
        this.authManager = new AppPasswordManager();
        this.authReady = false;
        
        // Initialize authentication and setup tracking
        this.initialize();
    }

    /**
     * Initialize authentication and setup tracking
     */
    async initialize() {
        try {
            this.authReady = await this.authManager.initialize();
            
            if (this.authReady) {
                console.log('AnalyticsTracker initialized with authentication:', {
                    sessionId: this.sessionId,
                    userId: this.userId,
                    apiBaseUrl: this.authManager.apiBaseUrl
                });
                
                // Setup event listeners after auth is ready
                this.setupEventListeners();
            } else {
                console.warn('Analytics authentication failed - tracking disabled');
            }
        } catch (error) {
            console.error('AnalyticsTracker initialization failed:', error);
            this.authReady = false;
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
     * Send analytics event to WordPress backend with authentication
     */
    async sendAnalyticsEvent(eventType, additionalData = {}) {
        // Skip if authentication not ready
        if (!this.authReady) {
            console.warn('Analytics authentication not ready, skipping event:', eventType);
            return null;
        }

        try {
            const analyticsData = this.collectAnalyticsData(eventType, additionalData);
            
            // Use authenticated request through AppPasswordManager
            const result = await this.authManager.submitAnalyticsEvent(analyticsData);
            
            if (result) {
                console.log(`Analytics event sent: ${eventType}`, {
                    eventId: result.id,
                    timestamp: analyticsData.ts_submitted
                });
            }
            
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
        const messageId = formData.messageId ? String(formData.messageId) : '';
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
        // Skip if authentication not ready
        if (!this.authReady) return;

        // Use sendBeacon for reliable exit tracking with authentication
        const analyticsData = this.collectAnalyticsData('exit', {
            chain_id: this.generateChainId('session')
        });

        if (navigator.sendBeacon) {
            // Create authenticated request for sendBeacon
            const headers = this.authManager.getAuthHeaders();
            const blob = new Blob([JSON.stringify(analyticsData)], {
                type: 'application/json'
            });

            navigator.sendBeacon(
                `${this.authManager.apiBaseUrl}/jet-cct/analytics_event`,
                blob
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