/**
 * CheckoutPage.js
 * Handles the checkout page functionality including deposit selection,
 * Stripe integration, customer data pre-population, and payment processing
 */

import { loadStripe } from '@stripe/stripe-js';
import SalesFunnelForm from './SalesFunnelForm.js';

class CheckoutPage {
    constructor() {
        this.stripe = null;
        this.salesFunnel = null;
        this.selectedDeposit = null;
        this.customerData = null;
        
        // Initialize deposit configuration - price IDs will be set after environment detection
        this.depositOptions = {};
        this.initializeDepositOptions();
        
        this.init();
    }

    /**
     * Initialize deposit options with environment-appropriate price IDs
     */
    initializeDepositOptions() {
        // Determine environment
        const isDevelopment = window.location.hostname.includes('localhost') || 
                             window.location.hostname.includes('.local') ||
                             window.location.hostname.includes('127.0.0.1');
        
        // Get environment-specific price IDs
        const starterPriceId = isDevelopment 
            ? import.meta.env.VITE_STRIPE_PRICE_ID_WEB_DEV_STARTER_DEV 
            : import.meta.env.VITE_STRIPE_PRICE_ID_WEB_DEV_STARTER_PROD;
            
        const standardPriceId = isDevelopment 
            ? import.meta.env.VITE_STRIPE_PRICE_ID_WEB_DEV_STANDARD_DEV 
            : import.meta.env.VITE_STRIPE_PRICE_ID_WEB_DEV_STANDARD_PROD;
            
        const premiumPriceId = isDevelopment 
            ? import.meta.env.VITE_STRIPE_PRICE_ID_WEB_DEV_PREMIUM_DEV 
            : import.meta.env.VITE_STRIPE_PRICE_ID_WEB_DEV_PREMIUM_PROD;
            
        const consultationPriceId = isDevelopment 
            ? import.meta.env.VITE_STRIPE_PRICE_ID_CONSULTATION_DEV 
            : import.meta.env.VITE_STRIPE_PRICE_ID_CONSULTATION_PROD;

        // Configure deposit options with environment-specific price IDs
        this.depositOptions = {
            99: {
                amount: 99,
                type: 'starter',
                name: 'Web Development Starter Deposit',
                priceId: starterPriceId,
                description: 'Perfect for small projects and consultations'
            },
            250: {
                amount: 250,
                type: 'standard', 
                name: 'Web Development Standard Deposit',
                priceId: standardPriceId,
                description: 'Ideal for medium-sized web development projects'
            },
            500: {
                amount: 500,
                type: 'premium',
                name: 'Web Development Premium Deposit', 
                priceId: premiumPriceId,
                description: 'Best for complex projects and full-scale development'
            },
            50: {
                amount: 50,
                type: 'consultation',
                name: 'Professional Consultation Deposit',
                priceId: consultationPriceId,
                description: 'Refundable consultation service deposit'
            }
        };
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
            
            this.loadCustomerData();
            this.initializeDepositSelection();
            this.initializePaymentHandlers();
            this.trackPageView();
            
            console.log('CheckoutPage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CheckoutPage:', error);
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
            
            console.log('Stripe initialized successfully');
        } catch (error) {
            console.error('Stripe initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load customer data from URL parameters or localStorage
     */
    loadCustomerData() {
        try {
            // Try to get customer data from URL parameters first
            const urlParams = new URLSearchParams(window.location.search);
            const messageId = urlParams.get('message_id');
            const chainId = urlParams.get('chain_id');
            
            if (messageId) {
                // In a real implementation, you'd fetch customer data from your API
                // For now, we'll use placeholder data
                this.customerData = {
                    messageId: messageId,
                    chainId: chainId,
                    name: urlParams.get('name') || 'Valued Customer',
                    email: urlParams.get('email') || 'customer@example.com',
                    projectType: urlParams.get('project_type') || 'Web Development Project',
                    submissionDate: new Date().toLocaleDateString()
                };
            } else {
                // Fallback to generic customer data
                this.customerData = {
                    messageId: null,
                    chainId: null,
                    name: 'Valued Customer',
                    email: 'Please provide your email during checkout',
                    projectType: 'Web Development Project',
                    submissionDate: new Date().toLocaleDateString()
                };
            }
            
            this.displayCustomerData();
        } catch (error) {
            console.error('Failed to load customer data:', error);
            this.customerData = {
                name: 'Valued Customer',
                email: 'customer@example.com',
                projectType: 'Web Development Project',
                submissionDate: new Date().toLocaleDateString()
            };
            this.displayCustomerData();
        }
    }

    /**
     * Display customer information in the UI
     */
    displayCustomerData() {
        const nameElement = document.getElementById('customerName');
        const emailElement = document.getElementById('customerEmail');
        const projectElement = document.getElementById('customerProject');
        const descriptionElement = document.getElementById('projectDescription');
        const typeElement = document.getElementById('projectType');
        const dateElement = document.getElementById('submissionDate');

        if (nameElement) nameElement.textContent = this.customerData.name;
        if (emailElement) emailElement.textContent = this.customerData.email;
        if (projectElement) projectElement.textContent = `${this.customerData.projectType} Deposit`;
        if (descriptionElement) {
            descriptionElement.textContent = `Secure your ${this.customerData.projectType.toLowerCase()} with a professional deposit to guarantee your development slot and begin project planning.`;
        }
        if (typeElement) typeElement.textContent = `Project Type: ${this.customerData.projectType}`;
        if (dateElement) dateElement.textContent = `Submitted: ${this.customerData.submissionDate}`;
    }

    /**
     * Initialize deposit selection functionality
     */
    initializeDepositSelection() {
        const depositCards = document.querySelectorAll('.deposit-card');
        const paymentProcessing = document.getElementById('paymentProcessing');
        
        depositCards.forEach(card => {
            const selectBtn = card.querySelector('.deposit-select-btn');
            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    const amount = parseInt(card.dataset.amount);
                    this.selectDeposit(amount);
                    
                    // Show payment processing section
                    if (paymentProcessing) {
                        paymentProcessing.style.display = 'block';
                        paymentProcessing.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        });

        // Change deposit button
        const changeDepositBtn = document.getElementById('changeDeposit');
        if (changeDepositBtn) {
            changeDepositBtn.addEventListener('click', () => {
                this.clearDepositSelection();
                if (paymentProcessing) {
                    paymentProcessing.style.display = 'none';
                }
                // Scroll back to deposit options
                const depositOptions = document.getElementById('depositOptions');
                if (depositOptions) {
                    depositOptions.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    /**
     * Select a deposit amount and update UI
     */
    selectDeposit(amount) {
        const deposit = this.depositOptions[amount];
        if (!deposit) return;

        this.selectedDeposit = deposit;
        
        // Update UI elements
        const selectedAmountElement = document.getElementById('selectedAmount');
        const selectedTypeElement = document.getElementById('selectedType');
        const proceedBtn = document.getElementById('proceedToPayment');
        
        if (selectedAmountElement) {
            selectedAmountElement.textContent = `$${deposit.amount}`;
        }
        if (selectedTypeElement) {
            selectedTypeElement.textContent = `${deposit.type.charAt(0).toUpperCase() + deposit.type.slice(1)} Deposit`;
        }
        if (proceedBtn) {
            proceedBtn.disabled = false;
            proceedBtn.querySelector('.btn-text').textContent = `Pay $${deposit.amount} Securely`;
        }

        // Update deposit card selection state
        document.querySelectorAll('.deposit-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-amount="${amount}"]`).classList.add('selected');

        // Track deposit selection
        this.trackDepositSelection(deposit);
    }

    /**
     * Clear deposit selection
     */
    clearDepositSelection() {
        this.selectedDeposit = null;
        
        const proceedBtn = document.getElementById('proceedToPayment');
        const selectedAmountElement = document.getElementById('selectedAmount');
        const selectedTypeElement = document.getElementById('selectedType');
        
        if (proceedBtn) {
            proceedBtn.disabled = true;
            proceedBtn.querySelector('.btn-text').textContent = 'Select a Deposit Amount';
        }
        if (selectedAmountElement) {
            selectedAmountElement.textContent = '$0';
        }
        if (selectedTypeElement) {
            selectedTypeElement.textContent = 'No deposit selected';
        }

        // Remove selection state from cards
        document.querySelectorAll('.deposit-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    /**
     * Initialize payment processing handlers
     */
    initializePaymentHandlers() {
        const proceedBtn = document.getElementById('proceedToPayment');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', async () => {
                if (this.selectedDeposit) {
                    await this.processPayment();
                }
            });
        }
    }

    /**
     * Process the payment using server-side Stripe Checkout Sessions
     */
    async processPayment() {
        if (!this.selectedDeposit) return;

        try {
            // Show loading state
            this.setPaymentLoadingState(true);

            // Track payment attempt
            this.trackPaymentAttempt(this.selectedDeposit);

            // Create checkout session via WordPress API
            const sessionData = {
                price_id: this.selectedDeposit.priceId,
                message_id: this.customerData.messageId || '',
                chain_id: this.customerData.chainId || '',
                project_type: this.customerData.projectType || '',
                deposit_type: this.selectedDeposit.type,
                customer_email: this.customerData.email !== 'Please provide your email during checkout' 
                    ? this.customerData.email 
                    : undefined,
                success_url: `${window.location.origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&message_id=${this.customerData.messageId || ''}&deposit_type=${this.selectedDeposit.type}`,
                cancel_url: `${window.location.origin}/checkout.html?message_id=${this.customerData.messageId || ''}`
            };

            // Build headers with authentication
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add authentication if available
            if (this.salesFunnel.authManager) {
                const authHeaders = await this.salesFunnel.authManager.getAuthHeaders();
                Object.assign(headers, authHeaders);
            }

            // Determine the full endpoint URL
            const endpointUrl = this.salesFunnel.authManager 
                ? `${this.salesFunnel.authManager.apiBaseUrl}/cmm/v1/create-checkout-session`
                : '/wp-json/cmm/v1/create-checkout-session';

            // Call WordPress API to create checkout session
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(sessionData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorType = response.status >= 500 ? 'server_error' : 'client_error';
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            if (!result.success || !result.checkout_url) {
                const errorType = 'session_creation_failed';
                throw new Error(result.message || 'Failed to create checkout session');
            }

            // Redirect to Stripe Checkout
            window.location.href = result.checkout_url;

        } catch (error) {
            console.error('Payment processing failed:', error);
            
            // Determine error type based on the error context
            let errorType = 'unknown';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorType = 'network_error';
            } else if (error.message.includes('HTTP 400')) {
                errorType = 'validation_error';
            } else if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
                errorType = 'authentication_error';
            } else if (error.message.includes('HTTP 5')) {
                errorType = 'server_error';
            } else if (error.message.includes('checkout session')) {
                errorType = 'session_creation_error';
            }
            
            this.handlePaymentError(error.message, errorType);
        } finally {
            this.setPaymentLoadingState(false);
        }
    }

    /**
     * Set payment button loading state
     */
    setPaymentLoadingState(isLoading) {
        const proceedBtn = document.getElementById('proceedToPayment');
        const btnText = proceedBtn?.querySelector('.btn-text');
        const spinner = proceedBtn?.querySelector('.btn-loading-spinner');

        if (proceedBtn) {
            if (isLoading) {
                proceedBtn.disabled = true;
                proceedBtn.classList.add('btn-loading');
                if (btnText) btnText.style.display = 'none';
                if (spinner) spinner.style.display = 'inline-block';
            } else {
                proceedBtn.disabled = false;
                proceedBtn.classList.remove('btn-loading');
                if (btnText) btnText.style.display = 'inline';
                if (spinner) spinner.style.display = 'none';
            }
        }
    }

    /**
     * Handle payment processing errors with detailed analytics
     */
    handlePaymentError(errorMessage, errorType = 'unknown') {
        console.error('Payment error:', errorMessage);
        
        // Determine error category for better analytics
        let errorCategory = 'unknown';
        if (errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
            errorCategory = 'network_error';
        } else if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
            errorCategory = 'authentication_error';
        } else if (errorMessage.includes('validation') || errorMessage.includes('400')) {
            errorCategory = 'validation_error';
        } else if (errorMessage.includes('stripe') || errorMessage.includes('payment')) {
            errorCategory = 'stripe_error';
        } else if (errorMessage.includes('session') || errorMessage.includes('checkout')) {
            errorCategory = 'session_creation_error';
        }
        
        // Track detailed payment error
        this.trackPaymentError(errorMessage, errorCategory, errorType);
        
        // Show user-friendly error message based on error type
        let userMessage = 'Payment processing failed. Please try again or contact support.';
        
        switch (errorCategory) {
            case 'network_error':
                userMessage = 'Connection issue detected. Please check your internet connection and try again.';
                break;
            case 'validation_error':
                userMessage = 'Payment information validation failed. Please verify your details and try again.';
                break;
            case 'stripe_error':
                userMessage = 'Payment processing error occurred. Please try again with a different payment method.';
                break;
            case 'session_creation_error':
                userMessage = 'Unable to initialize payment session. Please refresh the page and try again.';
                break;
        }
        
        this.showErrorMessage(userMessage);
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        // You can implement a notification system here
        // For now, we'll use a simple alert
        alert(message);
        
        // Alternatively, you could show an error in a designated area
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'notification error';
            errorDiv.textContent = message;
            notificationContainer.appendChild(errorDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    /**
     * Show success message to user
     */
    showSuccessMessage(message) {
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            const successDiv = document.createElement('div');
            successDiv.className = 'notification success';
            successDiv.textContent = message;
            notificationContainer.appendChild(successDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 5000);
        }
    }

    /**
     * Track page view for analytics
     */
    trackPageView() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('page_view', {
                page: 'checkout',
                funnel_stage: 'payment_processing',
                customer_message_id: this.customerData?.messageId || null
            });
        }
    }

    /**
     * Track deposit selection for analytics
     */
    trackDepositSelection(deposit) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('deposit_selected', {
                deposit_amount: deposit.amount,
                deposit_type: deposit.type,
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'deposit_selection'
            });
        }
    }

    /**
     * Track payment attempt for analytics
     */
    trackPaymentAttempt(deposit) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('payment_attempted', {
                deposit_amount: deposit.amount,
                deposit_type: deposit.type,
                payment_method: 'stripe_checkout',
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'payment_processing'
            });
        }
    }

    /**
     * Track payment error for analytics with detailed categorization
     */
    trackPaymentError(errorMessage, errorCategory = 'unknown', errorType = 'unknown') {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('payment_failed', {
                error_message: errorMessage,
                error_category: errorCategory,
                error_type: errorType,
                deposit_amount: this.selectedDeposit?.amount || null,
                deposit_type: this.selectedDeposit?.type || null,
                payment_method: 'stripe_checkout',
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'payment_processing',
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent.substring(0, 200), // Truncate for storage
                page_url: window.location.href
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CheckoutPage();
});

export default CheckoutPage;