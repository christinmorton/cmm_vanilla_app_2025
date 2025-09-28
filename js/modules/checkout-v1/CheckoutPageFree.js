/**
 * CheckoutPageFree.js
 * Handles the free consultation checkout page functionality including
 * lead collection, form processing, and analytics tracking without payment
 */

import SalesFunnelForm from './SalesFunnelForm.js';
import { API_ENDPOINTS } from '../config/api-config.js';

class CheckoutPageFree {
    constructor() {
        this.salesFunnel = null;
        this.leadData = null;
        this.formSubmitted = false;

        // Free consultation configuration
        this.freeConsultation = {
            amount: 0,
            type: 'consultation_free',
            name: 'Free Professional Consultation',
            description: 'Complimentary consultation session - no payment required'
        };

        this.init();
    }

    async init() {
        try {
            // Initialize sales funnel for analytics and data handling
            this.salesFunnel = new SalesFunnelForm({
                analyticsTracker: window.analyticsTracker
            });

            // Wait for authentication to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.loadCustomerData();
            this.initializeFormHandling();
            this.trackPageView();

            console.log('CheckoutPageFree initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CheckoutPageFree:', error);
            this.showErrorMessage('Failed to load consultation page. Please refresh and try again.');
        }
    }

    /**
     * Load customer data from URL parameters if available
     */
    loadCustomerData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const messageId = urlParams.get('message_id');
            const source = urlParams.get('source');

            this.leadData = {
                messageId: messageId || '',
                source: source || 'direct',
                timestamp: new Date().toISOString(),
                type: 'consultation_free'
            };

            console.log('Free consultation lead data loaded:', this.leadData);
        } catch (error) {
            console.error('Failed to load customer data:', error);
            this.leadData = {
                messageId: '',
                source: 'direct',
                timestamp: new Date().toISOString(),
                type: 'consultation_free'
            };
        }
    }

    /**
     * Initialize form submission handling
     */
    initializeFormHandling() {
        const form = document.getElementById('freeConsultationForm');
        if (!form) {
            console.error('Free consultation form not found');
            return;
        }

        console.log('Free consultation form found:', form);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submission triggered', e.target);
            await this.handleFormSubmission(e.target);
        });
    }

    /**
     * Handle free consultation form submission
     */
    async handleFormSubmission(form) {
        if (this.formSubmitted) return; // Prevent double submission

        console.log('handleFormSubmission called with:', form);
        console.log('Form type:', typeof form);
        console.log('Is HTMLFormElement:', form instanceof HTMLFormElement);

        try {
            // Show loading state
            this.setFormLoadingState(true);

            // Collect form data for our tracking (SalesFunnelForm will also extract it)
            const formData = this.extractFormData(form);
            console.log('Extracted form data:', formData);

            // Create lead record via API
            const result = await this.processFreeLead(formData, form);

            if (result.success) {
                this.handleSubmissionSuccess(result);
            } else {
                this.handleSubmissionError(result.error);
            }

        } catch (error) {
            console.error('Free consultation submission error:', error);
            this.handleSubmissionError('Sorry, something went wrong. Please try again.');
        } finally {
            if (!this.formSubmitted) {
                this.setFormLoadingState(false);
            }
        }
    }

    /**
     * Extract form data including optional fields
     */
    extractFormData(form) {
        // Validate that we have a proper form element
        if (!form) {
            console.error('extractFormData: form parameter is null or undefined');
            throw new Error('Form element is required');
        }

        if (!(form instanceof HTMLFormElement)) {
            console.error('extractFormData: parameter is not an HTMLFormElement', form);
            throw new Error('Parameter must be an HTMLFormElement');
        }

        let formData;
        try {
            formData = new FormData(form);
        } catch (error) {
            console.error('Failed to create FormData:', error);
            console.error('Form element:', form);
            throw error;
        }

        return {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            type: this.freeConsultation.type,
            amount: this.freeConsultation.amount,
            source: this.leadData.source,
            messageId: this.leadData.messageId,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Process free lead through API
     */
    async processFreeLead(leadData, formElement) {
        try {
            // Track lead collection attempt
            this.trackLeadAttempt(leadData);

            // Create analytics event for free consultation reservation
            if (window.analyticsTracker && typeof window.analyticsTracker.trackFormSubmit === 'function') {
                window.analyticsTracker.trackFormSubmit({
                    type: 'consultation_free',
                    status: 'submitted',
                    has_contact_info: !!(leadData.email || leadData.phone || leadData.name),
                    source: leadData.source
                });
            }

            // Submit to WordPress API (same endpoint as other forms, but with type 'consultation_free')
            // Pass the actual form element to SalesFunnelForm
            const result = await this.salesFunnel.handleFormSubmission('consultation_free', formElement, {
                userMessage: `Free consultation request - Name: ${leadData.name || 'Not provided'}, Email: ${leadData.email || 'Not provided'}, Phone: ${leadData.phone || 'Not provided'}`,
                leadData: leadData
            });

            if (result.success) {
                this.trackLeadSuccess(leadData);
            } else {
                this.trackLeadError(leadData, result.error);
            }

            return result;

        } catch (error) {
            console.error('Lead processing failed:', error);
            this.trackLeadError(leadData, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle successful form submission
     */
    handleSubmissionSuccess(result) {
        this.formSubmitted = true;
        const submitBtn = document.getElementById('reserveConsultationBtn');

        // Update button to show success
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            submitBtn.textContent = 'Consultation Reserved!';
            submitBtn.disabled = true;

            // Add success styling
            setTimeout(() => {
                submitBtn.style.backgroundColor = '#28a745';
                submitBtn.style.borderColor = '#28a745';
                submitBtn.style.color = 'white';
            }, 100);
        }

        // Show success message
        this.showSuccessMessage('Your free consultation has been reserved! We\'ll be in touch soon.');

        // Redirect to thank you page
        setTimeout(() => {
            window.location.href = `/thank-you.html?type=consultation_free&amount=0&source=${this.leadData.source}`;
        }, 2000);
    }

    /**
     * Handle form submission error
     */
    handleSubmissionError(error) {
        console.error('Free consultation submission failed:', error);
        this.showErrorMessage(error || 'Sorry, something went wrong. Please try again.');
    }

    /**
     * Set form loading state
     */
    setFormLoadingState(isLoading) {
        const submitBtn = document.getElementById('reserveConsultationBtn');
        if (!submitBtn) return;

        if (isLoading) {
            this.originalButtonText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.querySelector('.btn-text').textContent = 'Reserving...';
            submitBtn.querySelector('.btn-loading-spinner').style.display = 'inline-block';
        } else {
            if (!this.formSubmitted) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.querySelector('.btn-text').textContent = this.originalButtonText || 'Reserve Free Consultation';
                submitBtn.querySelector('.btn-loading-spinner').style.display = 'none';
            }
        }
    }

    /**
     * Track page view for analytics
     */
    trackPageView() {
        if (window.analyticsTracker && typeof window.analyticsTracker.trackPageLoad === 'function') {
            window.analyticsTracker.trackPageLoad();
        }
    }

    /**
     * Track lead collection attempt
     */
    trackLeadAttempt(leadData) {
        console.log('Free consultation lead attempt:', leadData);
    }

    /**
     * Track successful lead collection
     */
    trackLeadSuccess(leadData) {
        console.log('Free consultation lead success:', leadData);
    }

    /**
     * Track lead collection error
     */
    trackLeadError(leadData, error) {
        console.log('Free consultation lead error:', error, leadData);
    }

    /**
     * Show success message to user
     */
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Generic notification display
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="icon-${type === 'success' ? 'check' : type === 'error' ? 'warning' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Auto-initialize when module is imported
export default CheckoutPageFree;