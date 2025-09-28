/**
 * PaymentCancel.js
 * Handles payment cancel page analytics and user guidance
 */

import SalesFunnelForm from './SalesFunnelForm.js';

class PaymentCancel {
    constructor() {
        this.salesFunnel = null;
        this.cancelReason = null;
        this.originalDepositType = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize sales funnel for analytics
            this.salesFunnel = new SalesFunnelForm({
                analyticsTracker: window.analyticsTracker
            });
            
            // Extract cancel information from URL
            this.extractCancelInfo();
            
            // Track payment cancellation
            this.trackPaymentCancel();
            
            // Setup interaction tracking
            this.setupInteractionTracking();
            
            console.log('PaymentCancel initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PaymentCancel:', error);
        }
    }

    /**
     * Extract cancellation information from URL parameters
     */
    extractCancelInfo() {
        const urlParams = new URLSearchParams(window.location.search);
        
        this.originalDepositType = urlParams.get('deposit_type');
        this.cancelReason = this.determineCancelReason(urlParams);
        
        console.log('Cancel info extracted:', {
            depositType: this.originalDepositType,
            cancelReason: this.cancelReason
        });
    }

    /**
     * Determine the reason for cancellation based on URL parameters
     */
    determineCancelReason(urlParams) {
        // Check for specific Stripe cancel reasons
        const stripeError = urlParams.get('error');
        const errorType = urlParams.get('error_type');
        
        if (stripeError || errorType) {
            return 'stripe_error';
        }
        
        // Check if user came from checkout page (user-initiated cancel)
        const referrer = document.referrer;
        if (referrer && referrer.includes('checkout')) {
            return 'user_cancel';
        }
        
        // Check for session timeout or expiration
        const sessionId = urlParams.get('session_id');
        if (sessionId) {
            return 'session_expired';
        }
        
        // Default to user cancel if no specific reason found
        return 'user_cancel';
    }

    /**
     * Track payment cancellation event for analytics
     */
    trackPaymentCancel() {
        if (window.analyticsTracker) {
            const urlParams = new URLSearchParams(window.location.search);
            
            const depositAmountMap = {
                'starter': 99,
                'standard': 250,
                'premium': 500,
                'consultation': 50
            };
            
            window.analyticsTracker.trackEvent('payment_cancelled', {
                cancel_reason: this.cancelReason,
                deposit_type: this.originalDepositType,
                deposit_amount: depositAmountMap[this.originalDepositType] || null,
                payment_method: 'stripe_checkout',
                message_id: urlParams.get('message_id'),
                session_id: urlParams.get('session_id'),
                error_code: urlParams.get('error'),
                error_type: urlParams.get('error_type'),
                funnel_stage: 'payment_cancelled',
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                referrer: document.referrer.substring(0, 200)
            });
        }
    }

    /**
     * Setup tracking for user interactions on the cancel page
     */
    setupInteractionTracking() {
        // Track retry payment button clicks
        const retryButtons = document.querySelectorAll('[href*="checkout"]');
        retryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.trackCancelPageInteraction('retry_payment', {
                    button_text: button.textContent.trim(),
                    button_href: button.href
                });
            });
        });

        // Track consultation booking clicks
        const consultationButtons = document.querySelectorAll('[href*="consultation-booking"]');
        consultationButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.trackCancelPageInteraction('book_consultation', {
                    button_text: button.textContent.trim(),
                    button_href: button.href
                });
            });
        });

        // Track contact/email buttons
        const contactButtons = document.querySelectorAll('[href^="mailto:"]');
        contactButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.trackCancelPageInteraction('contact_email', {
                    button_text: button.textContent.trim(),
                    email_address: button.href.replace('mailto:', '')
                });
            });
        });

        // Track navigation to other pages
        const navButtons = document.querySelectorAll('.funnel-cta');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const href = button.href;
                let actionType = 'navigate';
                
                if (href.includes('portfolio')) {
                    actionType = 'view_portfolio';
                } else if (href.includes('service')) {
                    actionType = 'view_services';
                } else if (href.includes('/')) {
                    actionType = 'return_home';
                }
                
                this.trackCancelPageInteraction(actionType, {
                    button_text: button.textContent.trim(),
                    destination: href
                });
            });
        });
    }

    /**
     * Track specific interactions on the cancel page
     */
    trackCancelPageInteraction(actionType, additionalData = {}) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('cancel_page_interaction', {
                action_type: actionType,
                cancel_reason: this.cancelReason,
                original_deposit_type: this.originalDepositType,
                time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000),
                timestamp: new Date().toISOString(),
                ...additionalData
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PaymentCancel();
});

export default PaymentCancel;