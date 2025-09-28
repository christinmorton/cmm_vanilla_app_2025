/**
 * PaymentSuccess.js
 * Handles the payment success page functionality including
 * payment details display and invoice creation
 */

import SalesFunnelForm from './SalesFunnelForm.js';

class PaymentSuccess {
    constructor() {
        this.salesFunnel = null;
        this.sessionId = null;
        this.paymentData = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize sales funnel for analytics and API access
            this.salesFunnel = new SalesFunnelForm({
                analyticsTracker: window.analyticsTracker
            });
            
            // Wait for authentication to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Extract payment information from URL
            this.extractPaymentInfo();
            
            // Display payment details
            this.displayPaymentDetails();
            
            // Create invoice record (if needed)
            await this.createInvoiceRecord();
            
            // Track successful payment
            this.trackPaymentSuccess();
            
            console.log('PaymentSuccess initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PaymentSuccess:', error);
            this.displayErrorState();
        }
    }

    /**
     * Extract payment information from URL parameters
     */
    extractPaymentInfo() {
        const urlParams = new URLSearchParams(window.location.search);
        
        this.sessionId = urlParams.get('session_id');
        const messageId = urlParams.get('message_id');
        
        // Store for potential API calls
        this.paymentData = {
            sessionId: this.sessionId,
            messageId: messageId,
            timestamp: new Date().toISOString()
        };
        
        console.log('Payment info extracted:', this.paymentData);
    }

    /**
     * Display payment details in the UI
     */
    displayPaymentDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const depositType = urlParams.get('deposit_type');
        
        const depositAmountMap = {
            'starter': '$99',
            'standard': '$250', 
            'premium': '$500',
            'consultation': '$50'
        };
        
        const depositNameMap = {
            'starter': 'Starter Project Deposit',
            'standard': 'Standard Project Deposit',
            'premium': 'Premium Project Deposit', 
            'consultation': 'Consultation Deposit'
        };
        
        const depositAmountEl = document.getElementById('depositAmount');
        const paymentIdEl = document.getElementById('paymentId');
        const paymentDateEl = document.getElementById('paymentDate');
        const receiptLinkEl = document.getElementById('receiptLink');
        
        if (depositAmountEl) {
            const amount = depositAmountMap[depositType] || '$250';
            const name = depositNameMap[depositType] || 'Project Deposit';
            depositAmountEl.innerHTML = `${amount} <small>(${name})</small>`;
        }
        
        if (paymentIdEl) {
            paymentIdEl.textContent = this.sessionId ? 
                this.sessionId.substring(0, 30) + '...' : 
                'Payment ID not available';
        }
        
        if (paymentDateEl) {
            paymentDateEl.textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        if (receiptLinkEl && this.sessionId) {
            const receiptBtn = receiptLinkEl.querySelector('a');
            if (receiptBtn) {
                receiptBtn.href = `https://dashboard.stripe.com/test/payments/${this.sessionId}`;
                receiptBtn.target = '_blank';
                receiptBtn.onclick = null; // Remove the alert
            }
        }
    }

    /**
     * Create invoice record in WordPress
     */
    async createInvoiceRecord() {
        if (!this.sessionId) {
            console.warn('No session ID available for invoice creation');
            return;
        }

        try {
            // Get URL parameters for invoice data
            const urlParams = new URLSearchParams(window.location.search);
            const depositType = urlParams.get('deposit_type');
            const messageId = urlParams.get('message_id');
            
            const depositAmountMap = {
                'starter': '99',
                'standard': '250', 
                'premium': '500',
                'consultation': '50'
            };
            
            const invoiceData = {
                stripe_payment_intent_id: this.sessionId,
                message_id: messageId || '',
                chain_id: `payment_${Date.now()}`,
                customer_name: 'Stripe Customer', // Would need Stripe API call for real name
                customer_email: 'customer@stripe.com', // Would need Stripe API call for real email
                deposit_amount: depositAmountMap[depositType] || '250',
                currency: 'USD',
                payment_status: 'paid',
                stripe_customer_id: '',
                project_type: 'web_development_deposit',
                invoice_date: new Date().toISOString(),
                payment_date: new Date().toISOString(),
                notes: `${depositType} deposit payment processed via Stripe Checkout Session: ${this.sessionId}`,
                receipt_url: `https://dashboard.stripe.com/test/payments/${this.sessionId}`,
                created_date: new Date().toISOString(),
                last_modified: new Date().toISOString()
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
                ? `${this.salesFunnel.authManager.apiBaseUrl}/jet-cct/invoice`
                : '/wp-json/jet-cct/invoice';

            console.log('Creating invoice with data:', invoiceData);
            
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(invoiceData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Invoice created successfully:', result);
            
            return result;
            
        } catch (error) {
            console.error('Failed to create invoice record:', error);
            // Don't show error to user as this is a background operation
        }
    }

    /**
     * Display error state if initialization fails
     */
    displayErrorState() {
        const successTitle = document.querySelector('.success-title');
        const successSubtitle = document.querySelector('.success-subtitle');
        const paymentDetails = document.getElementById('paymentDetails');
        
        if (successTitle) {
            successTitle.textContent = 'Payment Status Unknown';
        }
        
        if (successSubtitle) {
            successSubtitle.textContent = 'We encountered an issue loading your payment details. Please contact support if you have concerns.';
        }
        
        if (paymentDetails) {
            paymentDetails.innerHTML = `
                <div class="details-card error">
                    <h2>Unable to Load Payment Details</h2>
                    <p>If you completed a payment, please check your email for confirmation. If you have any concerns, please contact support immediately.</p>
                    <div class="support-contact">
                        <a href="mailto:hello@christinmorton.com" class="funnel-cta primary">
                            Contact Support
                        </a>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Track payment success for analytics with deposit details
     */
    trackPaymentSuccess() {
        if (window.analyticsTracker) {
            const urlParams = new URLSearchParams(window.location.search);
            const depositType = urlParams.get('deposit_type');
            const depositAmountMap = {
                'starter': 99,
                'standard': 250,
                'premium': 500,
                'consultation': 50
            };
            
            window.analyticsTracker.trackEvent('payment_completed', {
                session_id: this.sessionId,
                message_id: this.paymentData?.messageId,
                deposit_type: depositType,
                deposit_amount: depositAmountMap[depositType] || 0,
                payment_method: 'stripe_checkout',
                timestamp: this.paymentData?.timestamp,
                page: 'payment-success',
                funnel_stage: 'payment_completed'
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PaymentSuccess();
});

export default PaymentSuccess;