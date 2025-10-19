/**
 * CheckoutPageCustom.js
 * Handles the custom amount checkout page functionality including
 * dynamic amount input, Stripe dynamic price creation, and custom payment processing
 */

import { loadStripe } from '@stripe/stripe-js';
import SalesFunnelForm from '../SalesFunnelForm.js';

class CheckoutPageCustom {
    constructor() {
        this.stripe = null;
        this.salesFunnel = null;
        this.customPayment = null;
        this.isProcessing = false;

        // Custom amount configuration
        this.customAmount = {
            minAmount: 1.00,        // Stripe minimum
            maxAmount: 5000.00,     // Reasonable upper limit
            type: 'custom_service', // Default type
            validation: {
                allowDecimals: true,
                noNegatives: true,
                dynamicPriceCreation: true
            }
        };

        this.init();
    }

    async init() {
        try {
            // Initialize Stripe
            await this.initializeStripe();

            // Initialize sales funnel for analytics and data handling
            this.salesFunnel = new SalesFunnelForm({
                analyticsTracker: window.analyticsTracker
            });

            // Wait for authentication to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.loadURLParameters();
            this.initializeFormHandling();
            this.initializeAmountValidation();
            this.trackPageView();

            console.log('CheckoutPageCustom initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CheckoutPageCustom:', error);
            this.showErrorMessage('Failed to load checkout page. Please refresh and try again.');
        }
    }

    /**
     * Initialize Stripe with the appropriate API key based on environment
     */
    async initializeStripe() {
        try {
            // Determine environment and get appropriate key
            const isDevelopment = window.location.hostname.includes('localhost') ||
                                 window.location.hostname.includes('.local') ||
                                 window.location.hostname.includes('127.0.0.1');
            const stripePublishableKey = isDevelopment
                ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_DEV
                : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_PROD;

            if (!stripePublishableKey || stripePublishableKey.includes('YOUR_')) {
                throw new Error('Stripe publishable key not configured');
            }

            this.stripe = await loadStripe(stripePublishableKey);

            if (!this.stripe) {
                throw new Error('Failed to load Stripe');
            }

            console.log('Stripe initialized successfully for custom checkout');
        } catch (error) {
            console.error('Stripe initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load and parse URL parameters for pre-population
     */
    loadURLParameters() {
        try {
            const urlParams = new URLSearchParams(window.location.search);

            // Get URL parameters
            const amount = urlParams.get('amount');
            const title = urlParams.get('title');
            const description = urlParams.get('description');
            const type = urlParams.get('type');
            const messageId = urlParams.get('message_id');

            // Pre-populate form if parameters exist
            if (amount) {
                const amountValue = parseFloat(amount);
                if (amountValue >= this.customAmount.minAmount && amountValue <= this.customAmount.maxAmount) {
                    document.getElementById('paymentAmount').value = amountValue.toFixed(2);
                }
            }

            if (title) {
                document.getElementById('serviceTitle').textContent = decodeURIComponent(title);
            }

            if (description) {
                document.getElementById('serviceDescriptionInput').value = decodeURIComponent(description);
                document.getElementById('serviceDescription').textContent = decodeURIComponent(description);
            }

            if (type) {
                document.getElementById('serviceType').textContent = this.formatServiceType(type);
            }

            // Store reference data
            this.referenceData = {
                messageId: messageId || '',
                sourceType: type || 'custom_service',
                prePopulated: !!(amount || title || description)
            };

            console.log('URL parameters loaded:', this.referenceData);

            // Update UI if pre-populated
            if (this.referenceData.prePopulated) {
                this.updateReviewButton();
            }

        } catch (error) {
            console.error('Failed to load URL parameters:', error);
            this.referenceData = {
                messageId: '',
                sourceType: 'custom_service',
                prePopulated: false
            };
        }
    }

    /**
     * Format service type for display
     */
    formatServiceType(type) {
        const typeMap = {
            'service': 'Professional Service',
            'invoice': 'Invoice Payment',
            'custom_service': 'Custom Service',
            'consultation': 'Consultation Service',
            'maintenance': 'Maintenance Service'
        };
        return typeMap[type] || 'Custom Service';
    }

    /**
     * Initialize form handling and button interactions
     */
    initializeFormHandling() {
        const form = document.getElementById('customPaymentForm');
        const reviewBtn = document.getElementById('reviewPaymentBtn');
        const proceedBtn = document.getElementById('proceedToPaymentBtn');
        const editBtn = document.getElementById('editPaymentBtn');

        // Review payment button
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                this.reviewPayment();
            });
        }

        // Form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleFormSubmission();
            });
        }

        // Edit payment button
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editPayment();
            });
        }
    }

    /**
     * Initialize amount input validation
     */
    initializeAmountValidation() {
        const amountInput = document.getElementById('paymentAmount');
        const descriptionInput = document.getElementById('serviceDescriptionInput');

        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.validateAmount();
                this.updateReviewButton();
            });

            amountInput.addEventListener('blur', () => {
                this.formatAmount();
            });
        }

        if (descriptionInput) {
            descriptionInput.addEventListener('input', () => {
                this.updateServiceDescription();
            });
        }
    }

    /**
     * Validate amount input
     */
    validateAmount() {
        const amountInput = document.getElementById('paymentAmount');
        const amount = parseFloat(amountInput.value);

        // Remove previous validation classes
        amountInput.classList.remove('invalid', 'valid');

        if (isNaN(amount) || amount < this.customAmount.minAmount) {
            amountInput.classList.add('invalid');
            return false;
        } else if (amount > this.customAmount.maxAmount) {
            amountInput.classList.add('invalid');
            return false;
        } else {
            amountInput.classList.add('valid');
            return true;
        }
    }

    /**
     * Format amount to 2 decimal places
     */
    formatAmount() {
        const amountInput = document.getElementById('paymentAmount');
        const amount = parseFloat(amountInput.value);

        if (!isNaN(amount)) {
            amountInput.value = amount.toFixed(2);
        }
    }

    /**
     * Update service description in the summary
     */
    updateServiceDescription() {
        const descriptionInput = document.getElementById('serviceDescriptionInput');
        const serviceDescription = document.getElementById('serviceDescription');

        const description = descriptionInput.value.trim();
        if (description) {
            serviceDescription.textContent = description;
        } else {
            serviceDescription.textContent = 'Professional service payment';
        }
    }

    /**
     * Update review button state
     */
    updateReviewButton() {
        const reviewBtn = document.getElementById('reviewPaymentBtn');
        const isValid = this.validateAmount();

        if (reviewBtn) {
            reviewBtn.disabled = !isValid;
        }
    }

    /**
     * Review payment details
     */
    reviewPayment() {
        const amountInput = document.getElementById('paymentAmount');
        const descriptionInput = document.getElementById('serviceDescriptionInput');

        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value.trim() || 'Custom Service';

        if (!this.validateAmount()) {
            this.showErrorMessage('Please enter a valid amount between $1.00 and $5,000.00');
            return;
        }

        // Update confirmation display
        document.getElementById('confirmAmount').textContent = `$${amount.toFixed(2)}`;
        document.getElementById('confirmDescription').textContent = description;
        document.getElementById('confirmTotal').textContent = `$${amount.toFixed(2)}`;

        // Show confirmation, hide form
        document.getElementById('paymentConfirmation').style.display = 'block';
        document.getElementById('reviewPaymentBtn').style.display = 'none';
        document.getElementById('proceedToPaymentBtn').style.display = 'block';
        document.getElementById('editPaymentBtn').style.display = 'block';

        // Disable form inputs
        amountInput.disabled = true;
        descriptionInput.disabled = true;

        // Scroll to confirmation
        document.getElementById('paymentConfirmation').scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Edit payment details
     */
    editPayment() {
        const amountInput = document.getElementById('paymentAmount');
        const descriptionInput = document.getElementById('serviceDescriptionInput');

        // Hide confirmation, show form
        document.getElementById('paymentConfirmation').style.display = 'none';
        document.getElementById('reviewPaymentBtn').style.display = 'block';
        document.getElementById('proceedToPaymentBtn').style.display = 'none';
        document.getElementById('editPaymentBtn').style.display = 'none';

        // Enable form inputs
        amountInput.disabled = false;
        descriptionInput.disabled = false;

        // Update review button state
        this.updateReviewButton();
    }

    /**
     * Handle form submission and payment processing
     */
    async handleFormSubmission() {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.setPaymentLoadingState(true);

            // Get payment details
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const description = document.getElementById('serviceDescriptionInput').value.trim() || 'Custom Service';

            // Create custom payment object
            this.customPayment = {
                amount: amount,
                description: description,
                type: this.referenceData.sourceType,
                messageId: this.referenceData.messageId
            };

            // Track payment attempt
            this.trackPaymentAttempt(this.customPayment);

            // Create dynamic checkout session
            const result = await this.createCustomCheckoutSession(this.customPayment);

            if (result.success && result.checkout_url) {
                // Redirect to Stripe Checkout
                window.location.href = result.checkout_url;
            } else {
                throw new Error(result.message || 'Failed to create checkout session');
            }

        } catch (error) {
            console.error('Custom payment processing failed:', error);
            this.handlePaymentError(error.message);
        } finally {
            this.isProcessing = false;
            this.setPaymentLoadingState(false);
        }
    }

    /**
     * Create custom checkout session with dynamic pricing
     */
    async createCustomCheckoutSession(paymentData) {
        try {
            // Get authentication headers if available
            let headers = {
                'Content-Type': 'application/json'
            };

            if (this.salesFunnel.authManager && this.salesFunnel.authManager.authReady) {
                const authHeaders = this.salesFunnel.authManager.getHeaders();
                Object.assign(headers, authHeaders);
            }

            // Store payment data for thank you page (without query params in Stripe URLs)
            sessionStorage.setItem('stripePaymentData', JSON.stringify({
                type: 'custom_service',
                amount: paymentData.amount,
                description: paymentData.description,
                timestamp: Date.now()
            }));

            // Prepare session data for custom checkout (clean URLs for Stripe)
            const sessionData = {
                amount: paymentData.amount,
                description: paymentData.description,
                type: paymentData.type,
                message_id: paymentData.messageId || '',
                success_url: `${window.location.origin}/thank-you.html`,
                cancel_url: `${window.location.origin}/payment-cancel.html`
            };

            // Use the custom checkout endpoint for dynamic pricing
            const endpointUrl = this.salesFunnel.authManager
                ? `${this.salesFunnel.authManager.apiBaseUrl}/cmm/v1/create-custom-checkout-session`
                : '/wp-json/cmm/v1/create-custom-checkout-session';

            // Call WordPress API to create custom checkout session
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(sessionData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (!result.success || !result.checkout_url) {
                throw new Error(result.message || 'Failed to create custom checkout session');
            }

            return result;

        } catch (error) {
            console.error('Custom checkout session creation failed:', error);
            throw error;
        }
    }

    /**
     * Set payment button loading state
     */
    setPaymentLoadingState(isLoading) {
        const proceedBtn = document.getElementById('proceedToPaymentBtn');
        const editBtn = document.getElementById('editPaymentBtn');

        if (proceedBtn) {
            if (isLoading) {
                proceedBtn.disabled = true;
                proceedBtn.querySelector('.btn-text').textContent = 'Processing...';
                proceedBtn.querySelector('.btn-loading-spinner').style.display = 'inline-block';
            } else {
                proceedBtn.disabled = false;
                proceedBtn.querySelector('.btn-text').textContent = 'Proceed to Secure Payment';
                proceedBtn.querySelector('.btn-loading-spinner').style.display = 'none';
            }
        }

        if (editBtn) {
            editBtn.disabled = isLoading;
        }
    }

    /**
     * Track payment attempt for analytics
     */
    trackPaymentAttempt(paymentData) {
        console.log('Custom payment attempt:', paymentData);

        if (window.analyticsTracker && typeof window.analyticsTracker.trackFormSubmit === 'function') {
            window.analyticsTracker.trackFormSubmit({
                type: 'custom_payment',
                amount: paymentData.amount,
                status: 'attempted',
                source: this.referenceData.sourceType
            });
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
     * Handle payment processing errors
     */
    handlePaymentError(errorMessage) {
        console.error('Custom payment error:', errorMessage);
        this.showErrorMessage(errorMessage || 'Payment processing failed. Please try again.');
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
export default CheckoutPageCustom;